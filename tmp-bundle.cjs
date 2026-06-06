var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_crypto = __toESM(require("crypto"), 1);

// src/lib/neural-optim.ts
var memCache = /* @__PURE__ */ new Map();
var persistFn = null;
var cache = {
  get: (key) => {
    const entry = memCache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.value;
    }
    if (entry) memCache.delete(key);
    return null;
  },
  set: (key, value, ttlSeconds = 3600) => {
    const expires = Date.now() + ttlSeconds * 1e3;
    memCache.set(key, { value, expires });
    if (persistFn) {
      try {
        persistFn(key, value, expires);
      } catch {
      }
    }
    if (memCache.size > 500) {
      const firstKey = memCache.keys().next().value;
      if (firstKey !== void 0) memCache.delete(firstKey);
    }
  }
};
var setPersistFn = (fn) => {
  persistFn = fn;
};
var pruneContext = (code) => {
  if (!code || typeof code !== "string") return "";
  try {
    const lines = code.split("\n");
    const filtered = lines.filter((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith("export ") || trimmed.startsWith("import ") || trimmed.startsWith("interface ") || trimmed.startsWith("type ") || trimmed.startsWith("function ") || trimmed.startsWith("class ") || trimmed.startsWith("const ") || trimmed.startsWith("let ") || trimmed.includes("(");
    });
    if (filtered.length === 0) return code.slice(0, 800);
    return filtered.join("\n").slice(0, 1500);
  } catch (err) {
    console.warn("Neural Pruning Warning:", err);
    return code.slice(0, 1e3);
  }
};

// src/lib/server-cache.ts
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var db = null;
var initialized = false;
async function initFirestore() {
  if (initialized) return db;
  initialized = true;
  try {
    let serviceAccount = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      };
    }
    if (!serviceAccount) {
      console.warn("Firebase Admin: no service account configured, using in-memory cache only");
      return null;
    }
    if (!import_firebase_admin.default.apps.length) {
      import_firebase_admin.default.initializeApp({
        credential: import_firebase_admin.default.credential.cert(serviceAccount)
      });
    }
    db = import_firebase_admin.default.firestore();
    console.log("Firebase Admin: connected, cache persistence enabled");
    return db;
  } catch (err) {
    console.warn("Firebase Admin: init failed, using in-memory cache only:", err);
    return null;
  }
}
async function hydrateCache() {
  const firestore = await initFirestore();
  if (!firestore) return;
  try {
    const now = Date.now();
    const snap = await firestore.collection("aiCache").where("expires", ">", now).orderBy("expires", "desc").limit(200).get();
    let count = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      const ttlSeconds = Math.max(1, Math.floor((data.expires - now) / 1e3));
      cache.set(doc.id, data.value, ttlSeconds);
      count++;
    }
    if (count > 0) {
      console.log(`Firebase Admin: hydrated ${count} cache entries from Firestore`);
    }
  } catch (err) {
    console.warn("Firebase Admin: cache hydration failed:", err);
  }
}
async function persistCacheEntry(key, value, expiresAt) {
  const firestore = await initFirestore();
  if (!firestore) return;
  try {
    await firestore.collection("aiCache").doc(key).set({
      value,
      expires: expiresAt,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn("Firebase Admin: cache persist failed:", err);
  }
}
hydrateCache().catch(() => {
});

// server.ts
var DEBUG_TOKEN = process.env.DEBUG_TOKEN || "";
function requireDebugAuth(req, res, next) {
  const token = req.headers["x-debug-token"] || req.query.debug_token || req.body?.debug_token || "";
  if (!DEBUG_TOKEN || token !== DEBUG_TOKEN) {
    return res.status(403).json({ error: "FORBIDEN_DEBUG_ACCESS" });
  }
  next();
}
try {
  import_dotenv.default.config({ path: ".env.local" });
} catch {
}
var rateLimitMap = /* @__PURE__ */ new Map();
function rateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: "RATE_LIMIT_EXCEEDED", retryAfter: Math.ceil((entry.resetAt - now) / 1e3) });
    }
    next();
  };
}
var limiter = rateLimit(6e4, 60);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
app.use(limiter);
setPersistFn(persistCacheEntry);
async function recordAuditLog(action, userId, details) {
  try {
    const adminSdk = await import("firebase-admin");
    let serviceAccount;
    try {
      serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : void 0;
    } catch {
      serviceAccount = void 0;
    }
    if (serviceAccount && typeof serviceAccount === "object") {
      if (!adminSdk.apps.length) {
        adminSdk.initializeApp({
          credential: adminSdk.credential.cert(serviceAccount)
        });
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      if (!adminSdk.apps.length) {
        adminSdk.initializeApp({
          credential: adminSdk.credential.applicationDefault()
        });
      }
    }
    const db2 = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (db2) {
      await db2.collection("auditLogs").add({ action, userId, details, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
var GoogleGenAI = null;
var Razorpay = null;
var cacheObj = cache;
var getAI = async () => {
  if (!GoogleGenAI) {
    const sdk = await import("@google/genai");
    GoogleGenAI = sdk.GoogleGenAI;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};
var getRazorpay = async () => {
  if (!Razorpay) {
    const mod = await import("razorpay");
    Razorpay = mod && mod.default || mod;
  }
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!key_id || !key_secret) {
    console.warn("Razorpay credentials not configured - using fallback for development only");
    return null;
  }
  return new Razorpay({ key_id, key_secret });
};
var handleHealth = (req, res) => {
  try {
    const services = { api: "ok" };
    services.gemini = process.env.GEMINI_API_KEY ? "healthy" : "missing";
    services.razorpay = process.env.RAZORPAY_KEY_ID ? "healthy" : "missing";
    services.firebase = process.env.FIREBASE_PROJECT_ID ? "healthy" : "missing";
    services.email = process.env.RESEND_API_KEY ? "healthy" : "missing";
    const hasFirebaseCreds = !!(process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    services.cache = hasFirebaseCreds ? "persisted" : "in-memory";
    const payload = {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      services,
      env: { mode: process.env.NODE_ENV || "development", node: process.version },
      version: "1.2.3-neural"
    };
    res.status(200).json(payload);
  } catch (err) {
    res.status(200).json({ status: "error", error: err instanceof Error ? err.message : "Health check failed", timestamp: (/* @__PURE__ */ new Date()).toISOString(), version: "1.2.3-neural" });
  }
};
app.get("/api/health", handleHealth);
app.get("/api/health/smoke", async (req, res) => {
  const checks = { config: "fail", razorpay_create_order: "fail", ai_heartbeat: "fail" };
  try {
    const cfg = await fetch("/api/config", { headers: { "x-smoke": "1" } }).then((r) => r.clone().json()).catch(() => ({}));
    checks.config = cfg?.razorpayKeyId ? "pass" : "fail";
  } catch {
    checks.config = "fail";
  }
  try {
    const rzp = await getRazorpay();
    checks.razorpay_create_order = rzp ? "pass" : "fail";
  } catch {
    checks.razorpay_create_order = "fail";
  }
  try {
    const ai = await getAI();
    checks.ai_heartbeat = ai ? "pass" : "fail";
  } catch {
    checks.ai_heartbeat = "fail";
  }
  const allPass = Object.values(checks).every((v) => v === "pass");
  res.status(allPass ? 200 : 503).json({ status: allPass ? "ok" : "degraded", timestamp: (/* @__PURE__ */ new Date()).toISOString(), checks });
});
app.get("/api/config", (req, res) => {
  try {
    const paypalId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
    const paypalSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || "";
    const razorpayId = process.env.RAZORPAY_KEY_ID || "";
    res.json({
      paypalClientId: paypalId,
      razorpayKeyId: razorpayId,
      isPaypalLive: true,
      hasPaypalSecret: !!paypalSecret,
      paypalMode: "live",
      serverMode: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    console.error("Config fetch error:", error);
    res.status(500).json({ error: "CONFIG_SYNC_ERROR" });
  }
});
app.post("/api/ai/orchestrate", async (req, res) => {
  const { prompt, context, role } = req.body;
  const ai = await getAI();
  if (!ai) return res.status(503).json({ error: "AI_SERVICE_UNAVAILABLE" });
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  const cacheKey = import_crypto.default.createHash("md5").update(`${prompt}-${role}-${JSON.stringify(context)}`).digest("hex");
  const cachedResult = cacheObj.get(cacheKey);
  if (cachedResult) {
    console.log("Neural Optimization: Cache Hit for Orchestration");
    return res.json({ text: cachedResult, source: "neural_cache" });
  }
  try {
    const roles = {
      developer: "You are the Aigent Developer at Aigent.ai. You generate high-quality code (frontend, backend, APIs). Return only code or technical explanations.",
      designer: "You are the Aigent Designer at Aigent.ai. You focus on UI/UX, glassmorphism, and modern aesthetics. Provide design specs or component code.",
      pm: "You are the Aigent Project Manager. You plan tasks, break down prompts into actionable steps for other agents.",
      qa: "You are the Aigent QA Tester. You find bugs and suggest fixes.",
      market: "You are the Aigent Marketing Manager. You create copy, SEO tags, and social content.",
      debugger: "You are the Aigent Debugger. Analyze the provided code for errors and provide fixed versions.",
      explainer: "You are the Aigent Code Explainer. Explain the logic and flow of the provided code in simple terms.",
      improver: "You are the Aigent UI Improver. Suggest enhancements for responsiveness, accessibility, and modern aesthetics.",
      security: "You are the Aigent Security Officer. Audit the code for common vulnerabilities and suggest improvements.",
      finance: "You are the Aigent Finance Manager. Help with business models, pricing strategies, and revenue projections."
    };
    const systemInstruction = roles[role] || "You are an autonomous AI Agent at Aigent.ai, a next-gen AI Business Engine.";
    let neuralPrompt = prompt;
    if (context && typeof context === "string") {
      neuralPrompt = `Context (Pruned):
${pruneContext(context)}

User Request: ${prompt}`;
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: neuralPrompt,
      config: { systemInstruction, temperature: 0.7 }
    });
    cacheObj.set(cacheKey, response.text, 1800);
    res.json({ text: response.text, source: "neural_generative" });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) return res.status(400).json({ error: "All fields are required" });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format" });
  try {
    const adminSdk = await import("firebase-admin");
    let serviceAccount;
    try {
      serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : void 0;
    } catch {
      serviceAccount = void 0;
    }
    if (serviceAccount && typeof serviceAccount === "object") {
      if (!adminSdk.apps.length) {
        adminSdk.initializeApp({
          credential: adminSdk.credential.cert(serviceAccount)
        });
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      if (!adminSdk.apps.length) {
        adminSdk.initializeApp({
          credential: adminSdk.credential.applicationDefault()
        });
      }
    }
    const db2 = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (db2) {
      await db2.collection("contacts").add({ name, email, subject, message, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    } else {
      console.log("Contact Form Submission (no Firestore):", { name, email, subject, message });
    }
    await recordAuditLog("contact_submission", email, `From ${name}: ${subject}`);
    res.json({ status: "ok", message: "Message received" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/ai/build", async (req, res) => {
  const { prompt } = req.body;
  const ai = await getAI();
  if (!ai) return res.status(503).json({ error: "AI_SERVICE_UNAVAILABLE" });
  try {
    const planResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Create a file structure and technical plan for: ${prompt}. Return a JSON structure.`,
      config: {
        systemInstruction: "You are the AI Project Manager. Plan the app architecture.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            files: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: { path: { type: "string" }, description: { type: "string" } },
                required: ["path", "description"]
              }
            }
          },
          required: ["files"]
        }
      }
    });
    const plan = JSON.parse(planResponse.text);
    const files = {};
    await Promise.all(
      (plan.files || []).map(async (file) => {
        const fileResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `Generate the complete source code for the file "${file.path}" in this project: ${prompt}. File purpose: ${file.description}. Return ONLY the raw code, no explanations or markdown fences.`,
          config: { systemInstruction: "You are an expert developer. Generate production-ready, complete source code for the specified file. Return only the code content, nothing else." }
        });
        files[file.path] = fileResponse.text.replace(/^```[\w]*\n?/gm, "").replace(/\n?```$/gm, "").trim();
      })
    );
    res.json({ plan, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
var tierLimits = {
  free: { tokens: 5e4, projects: 3 },
  scale: { tokens: 1e6, projects: 50 },
  enterprise: { tokens: Infinity, projects: Infinity }
};
var getTierFromSubscription = (subscription) => {
  const normalized = typeof subscription === "string" ? subscription.toLowerCase() : "";
  return ["free", "scale", "enterprise"].includes(normalized) ? normalized : "free";
};
var verifyUserSubscription = async (userId) => {
  try {
    const adminSdk = await import("firebase-admin");
    if (!adminSdk.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
      if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        adminSdk.initializeApp({
          credential: serviceAccount ? adminSdk.credential.cert(serviceAccount) : adminSdk.credential.applicationDefault()
        });
      }
    }
    const db2 = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (!db2) return null;
    const userDoc = await db2.collection("users").doc(userId).get();
    if (!userDoc.exists) return null;
    return userDoc.data();
  } catch (err) {
    console.error("Verify user subscription failed:", err);
    return null;
  }
};
app.post("/api/tasks/execute", async (req, res) => {
  const { taskId, userId } = req.body;
  if (!taskId || !userId) return res.status(400).json({ error: "taskId and userId are required" });
  const user = await verifyUserSubscription(userId);
  const tier = getTierFromSubscription(user?.subscription || "free");
  const limits = tierLimits[tier] || tierLimits.free;
  const existingUsage = await (async () => {
    try {
      const adminSdk = await import("firebase-admin");
      if (!adminSdk.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
        if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
          adminSdk.initializeApp({
            credential: serviceAccount ? adminSdk.credential.cert(serviceAccount) : adminSdk.credential.applicationDefault()
          });
        }
      }
      const db2 = adminSdk.apps.length ? adminSdk.firestore() : null;
      if (!db2) return 0;
      const monthStart = /* @__PURE__ */ new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const snaps = await db2.collection("tasks").where("userId", "==", userId).where("createdAt", ">=", monthStart.toISOString()).get();
      const total = snaps.docs.reduce((sum, doc) => sum + (doc.data().tokens || 0), 0);
      return total;
    } catch {
      return 0;
    }
  })();
  if (existingUsage >= limits.tokens && tier !== "enterprise") {
    return res.status(429).json({ error: "TOKEN_LIMIT_EXCEEDED", message: `You have reached your monthly token limit for ${tier} tier.` });
  }
  let taskDoc = null;
  try {
    const adminSdk = await import("firebase-admin");
    if (!adminSdk.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
      if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        adminSdk.initializeApp({
          credential: serviceAccount ? adminSdk.credential.cert(serviceAccount) : adminSdk.credential.applicationDefault()
        });
      }
    }
    const db2 = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (!db2) {
      return res.status(503).json({ error: "Database unavailable" });
    }
    const taskRef = db2.collection("tasks").doc(taskId);
    const snap = await taskRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Task not found" });
    taskDoc = { id: snap.id, ...snap.data() };
    if (taskDoc.userId !== userId) return res.status(403).json({ error: "Access denied" });
    if (taskDoc.status !== "pending") return res.status(409).json({ error: "Task is not pending", status: taskDoc.status });
  } catch (err) {
    console.error("Task load error:", err);
    return res.status(500).json({ error: err.message || "Failed to load task" });
  }
  let executionResult = { success: false, output: null, error: null };
  try {
    const ai = await getAI();
    if (!ai) throw new Error("AI service unavailable");
    const prompt = taskDoc.prompt || taskDoc.description || "";
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { systemInstruction: "You are an autonomous AI agent executing business tasks.", temperature: 0.7 }
    });
    executionResult = { success: true, output: response.text, error: null };
  } catch (err) {
    console.error("Task execution failed:", err);
    executionResult = { success: false, output: null, error: err.message || "Execution failed" };
  }
  try {
    const adminSdk = await import("firebase-admin");
    if (!adminSdk.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
      if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        adminSdk.initializeApp({
          credential: serviceAccount ? adminSdk.credential.cert(serviceAccount) : adminSdk.credential.applicationDefault()
        });
      }
    }
    const db2 = adminSdk.apps.length ? adminSdk.firestore() : null;
    const tokens = executionResult.output ? Math.ceil(executionResult.output.length / 4) : 0;
    if (db2) {
      await db2.collection("tasks").doc(taskId).update({
        status: executionResult.success ? "completed" : "failed",
        result: executionResult.output,
        error: executionResult.error,
        tokens,
        completedAt: (/* @__PURE__ */ new Date()).toISOString(),
        processingTime: Math.round((Date.now() - new Date(taskDoc.createdAt || Date.now()).getTime()) / 1e3)
      });
    }
  } catch (err) {
    console.error("Task finalize error:", err);
  }
  res.json({ success: executionResult.success, output: executionResult.output, error: executionResult.error, taskId });
});
app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    const rzp = await getRazorpay();
    if (!rzp) return res.status(503).json({ error: "RAZORPAY_NOT_CONFIGURED" });
    const { planName = "" } = req.body;
    const normalizedPlan = typeof planName === "string" ? planName.toLowerCase() : "";
    const amountMap = { scale: 6900, enterprise: 29900 };
    const amount = amountMap[normalizedPlan];
    if (!amount) return res.status(400).json({ error: "INVALID_PLAN" });
    let order;
    try {
      order = await rzp.orders.create({ amount, currency: "USD", receipt: `order_${Date.now()}` });
    } catch (err) {
      return res.status(400).json({ error: "RAZORPAY_ORDER_FAILED", message: err?.message || "Razorpay rejected the order" });
    }
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName
    });
  } catch (err) {
    console.error("Razorpay create order failed:", err);
    res.status(500).json({ error: "RAZORPAY_ORDER_FAILED", message: err?.message || "Failed to create order" });
  }
});
app.post("/api/razorpay/verify-payment", async (req, res) => {
  const razorpayOrderId = req.body?.razorpay_order_id;
  const razorpayPaymentId = req.body?.razorpay_payment_id;
  const razorpaySignature = req.body?.razorpay_signature;
  const planName = req.body?.planName;
  const amount = req.body?.amount;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "MISSING_VERIFICATION_FIELDS" });
  }
  try {
    const cryptoMod = await import("crypto");
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = cryptoMod.default.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(body).digest("hex");
    if (expectedSignature !== razorpaySignature) {
      const billingRef = (await import("firebase-admin")).default.firestore().collection("transactions").doc();
      await billingRef.set({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        planName: planName || "unknown",
        amount: amount != null ? String(amount) : "0",
        status: "failed",
        failureReason: "Invalid payment signature",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return res.status(400).json({ error: "INVALID_SIGNATURE" });
    }
    const orderDetails = await new Promise((resolve, reject) => {
      const rzp = Razorpay ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || "", key_secret: process.env.RAZORPAY_KEY_SECRET || "" }) : null;
      if (!rzp) return reject(new Error("RAZORPAY_NOT_CONFIGURED"));
      rzp.orders.fetch(razorpayOrderId, (err, order) => {
        if (err) reject(err);
        else resolve(order);
      });
    });
    const adminSdk = await import("firebase-admin");
    if (!adminSdk.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
      if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        adminSdk.initializeApp({
          credential: serviceAccount ? adminSdk.credential.cert(serviceAccount) : adminSdk.credential.applicationDefault()
        });
      }
    }
    const db2 = adminSdk.apps.length ? adminSdk.default.firestore() : null;
    if (!orderDetails) {
      if (db2) {
        const billingRef = db2.collection("transactions").doc();
        await billingRef.set({ razorpayOrderId, razorpayPaymentId, planName: planName || "unknown", amount: amount != null ? String(amount) : "0", status: "failed", failureReason: "Order fetch failed", createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      }
      return res.status(502).json({ error: "ORDER_FETCH_FAILED" });
    }
    const allowedStatuses = ["paid", "authorized"];
    const orderStatus = typeof orderDetails?.status === "string" ? orderDetails.status.toLowerCase() : "";
    const orderAmount = typeof orderDetails?.amount === "number" ? orderDetails.amount : null;
    const authorizedWithCapture = orderStatus === "authorized" && typeof orderDetails?.amount_captured === "number" && orderDetails.amount_captured > 0;
    if (!allowedStatuses.includes(orderStatus) || orderStatus === "authorized" && !authorizedWithCapture) {
      if (db2) {
        const billingRef = db2.collection("transactions").doc();
        await billingRef.set({ razorpayOrderId, razorpayPaymentId, planName: planName || "unknown", amount: amount != null ? String(amount) : "0", status: "failed", failureReason: `Unsupported order status: ${orderDetails?.status}`, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      }
      return res.status(400).json({ error: "ORDER_NOT_PAID", status: orderDetails?.status });
    }
    if (orderAmount && orderAmount > 0 && amount != null && Number(amount) !== orderAmount) {
      if (db2) {
        const billingRef = db2.collection("transactions").doc();
        await billingRef.set({ razorpayOrderId, razorpayPaymentId, planName: planName || "unknown", amount: amount != null ? String(amount) : "0", status: "failed", failureReason: "Amount mismatch", createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      }
      return res.status(400).json({ error: "AMOUNT_MISMATCH" });
    }
    if (db2) {
      await db2.collection("transactions").add({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        planName: planName || "unknown",
        amount: amount != null ? String(amount) : "0",
        status: "success",
        failureReason: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({ verified: true, orderId: razorpayOrderId, paymentId: razorpayPaymentId, planName, amount });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    try {
      const adminSdk = await import("firebase-admin");
      if (!adminSdk.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
        if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
          adminSdk.initializeApp({
            credential: serviceAccount ? adminSdk.credential.cert(serviceAccount) : adminSdk.credential.applicationDefault()
          });
        }
      }
      const db2 = adminSdk.apps.length ? adminSdk.default.firestore() : null;
      if (db2) {
        await db2.collection("transactions").add({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          planName: planName || "unknown",
          amount: amount != null ? String(amount) : "0",
          status: "failed",
          error: err?.message || "Verification failed",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch {
    }
    res.status(500).json({ error: "VERIFICATION_FAILED" });
  }
});
app.post("/api/razorpay/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const body = JSON.stringify(req.body);
  const expectedSignature = import_crypto.default.createHmac("sha256", webhookSecret).update(body).digest("hex");
  if (signature !== expectedSignature) return res.status(400).json({ error: "INVALID_WEBHOOK" });
  const event = req.body;
  if (event.payload && event.payload.payment && event.payload.payment.entity) {
    const payment = event.payload.payment.entity;
    try {
      const adminSdk = await import("firebase-admin");
      if (!adminSdk.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
        if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
          adminSdk.initializeApp({
            credential: serviceAccount ? adminSdk.credential.cert(serviceAccount) : adminSdk.credential.applicationDefault()
          });
        }
      }
      const db2 = adminSdk.apps.length ? adminSdk.firestore() : null;
      if (db2) {
        await db2.collection("transactions").add({ paymentId: payment.id, status: payment.status, amount: payment.amount, currency: payment.currency, method: payment.method, email: payment.email, contact: payment.contact, createdAt: event.created_at || (/* @__PURE__ */ new Date()).toISOString() });
      }
    } catch (err) {
      console.error("Razorpay webhook store failed:", err);
    }
  }
  res.status(200).json({ received: true });
});
app.post("/api/deploy/ai", async (req, res) => {
  const { target = "vercel" } = req.body;
  res.status(410).json({ error: "DEPLOY_ENDPOINT_DEPRECATED", message: "Use the Vercel integration or local build pipeline instead." });
});
app.use(requireDebugAuth, import_express.default.json());
app.get("/api/status/debug", (req, res) => {
  const skipped = ["REDIS_URL", "DATABASE_URL"];
  const report = { ok: true, env: {} };
  for (const [name, value] of Object.entries(process.env)) {
    if (!skipped.includes(name)) {
      report.env[name] = value ? `${value.slice(0, 6)}****` : value;
    }
  }
  report.services = {
    raven: process.env.RAVEN_API_KEY ? "configured" : "missing",
    gemini: process.env.GEMINI_API_KEY ? "configured" : "missing",
    razorpay: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "configured" : "missing",
    resend: process.env.RESEND_API_KEY ? "configured" : "missing",
    firebase: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_PROJECT_ID ? "configured" : "missing",
    openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
    anthropic: process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
    geminiKey: "configured"
  };
  report.routes = [];
  if (app._router) {
    const routes = app._router.stack.filter((r) => r.route);
    for (const r of routes) {
      const path2 = r.route?.path;
      const methods = Object.keys(r.route?.methods || {}).join(",") || "middleware";
      if (path2) report.routes.push({ methods, path: path2.toString() });
    }
  }
  res.json(report);
});
app.use(import_express.default.static(import_path.default.resolve("dist/client")));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });
  const clientPath = import_path.default.resolve("dist/client/index.html");
  if (!import_fs.default.existsSync(clientPath)) return res.status(404).json({ error: "Client build not available" });
  res.sendFile(clientPath);
});
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: err instanceof Error ? err.message : "Unknown error" });
});
var isVercel = ["1", "true"].includes(String(process.env.VERCEL || "").toLowerCase());
var isTest = String(process.env.NODE_ENV || "").toLowerCase() === "test";
if (!isTest && !isVercel) {
  app.listen(PORT, "0.0.0.0", () => console.log(`Neural Engine online on http://0.0.0.0:${PORT}/api/health`));
}
var server_default = app;
//# sourceMappingURL=tmp-bundle.cjs.map
