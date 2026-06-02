import express from "express";
import path from "path";
import { Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { pruneContext, cache, setPersistFn } from "./src/lib/neural-optim";
import { persistCacheEntry } from "./src/lib/server-cache";

dotenv.config({ path: ".env.local" });

// --- Rate Limiting ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(windowMs: number, maxRequests: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: "RATE_LIMIT_EXCEEDED", retryAfter: Math.ceil((entry.resetAt - now) / 1000) });
    }
    next();
  };
}

// Apply rate limiting: 60 requests per minute per IP
const limiter = rateLimit(60_000, 60);

// Wire Firestore cache persistence
setPersistFn(persistCacheEntry);

// Audit log helper
async function recordAuditLog(action: string, userId: string, details: string) {
  try {
    const adminSdk = await import("firebase-admin");
    if (!adminSdk.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;
      if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        adminSdk.initializeApp({
          credential: serviceAccount
            ? adminSdk.credential.cert(serviceAccount)
            : adminSdk.credential.applicationDefault(),
        });
      }
    }
    const db = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (db) {
      await db.collection("auditLogs").add({
        action,
        userId,
        details,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(limiter);

// Dynamic Import Cache
let GoogleGenAI: any = null;
let paypal: any = null;
let Razorpay: any = null;

const getAI = async () => {
  if (!GoogleGenAI) {
    const sdk = await import("@google/genai");
    GoogleGenAI = sdk.GoogleGenAI;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const getRazorpay = async () => {
  if (!Razorpay) {
    Razorpay = (await import("razorpay")).default;
  }
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

  // Fallback warning - should be handled in CI/CD
  if (!key_id || !key_secret) {
    console.warn("Razorpay credentials not configured - using fallback for development only");
    return null;
  }

  return new Razorpay({ key_id, key_secret });
};

const getPayPalSDK = async () => {
  if (!paypal) {
    paypal = (await import("@paypal/checkout-server-sdk")).default;
  }
  return paypal;
};

// API routes go here FIRST
app.get("/api/health", (req, res) => {
  try {
    const paypalId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
    const razorpayReady = !!(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET
    );
    const geminiReady = !!process.env.GEMINI_API_KEY;
    const firebaseReady = !!(
      process.env.FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    );
    const resendReady = !!process.env.RESEND_API_KEY;
    const services = {
      gemini: geminiReady ? "healthy" : "disconnected",
      paypal: !!paypalId ? "connected" : "disconnected",
      razorpay: razorpayReady ? "healthy" : "idle",
      firebase: firebaseReady ? "healthy" : "idle",
      email: resendReady ? "healthy" : "idle",
      cache: firebaseReady ? "persisted" : "in-memory",
    } as Record<string, string>;

    const degraded = Object.values(services).some(v => v === "disconnected" || v === "idle");
    const status = degraded ? "degraded" : "ok";

    const healthStatus = {
      status,
      timestamp: new Date().toISOString(),
      services,
      env: {
        node: process.version,
        mode: process.env.NODE_ENV,
        has_paypal_secret: !!process.env.PAYPAL_CLIENT_SECRET,
      },
      version: "1.2.3-neural",
    };
    res.status(status === "ok" ? 200 : 503).json(healthStatus);
  } catch (err) {
    res.status(500).json({ status: "error", error: "Health check failed" });
  }
});

app.get("/api/health/smoke", async (req, res) => {
  const checks: Record<string, "pass" | "fail"> = {
    config: "pass",
    razorpay_create_order: "fail",
    ai_heartbeat: "fail",
  };

  try {
    const cfg = await fetch("/api/config", { headers: { "x-smoke": "1" } }).then(r => r.clone().json()).catch(() => ({}));
    checks.config = !!cfg?.razorpayKeyId ? "pass" : "fail";
  } catch {
    checks.config = "fail";
  }

  try {
    const rzp = await import("./src/lib/razorpay-client").then(m => m.getRazorpay()).catch(() => null);
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

  const allPass = Object.values(checks).every(v => v === "pass");
  res.status(allPass ? 200 : 503).json({
    status: allPass ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.get("/api/config", (req, res) => {
  try {
    const paypalId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
    const paypalSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || "";
    const razorpayId = process.env.RAZORPAY_KEY_ID || ""; // Removed VITE_ prefix - server-side only

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

// AI Agent Orchestration Endpoint
app.post("/api/ai/orchestrate", async (req, res) => {
  const { prompt, context, role } = req.body;
  const ai = await getAI();

  if (!ai) {
    return res.status(503).json({ error: "AI_SERVICE_UNAVAILABLE" });
  }

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Optimization: Generate Cache Key
  const cacheKey = crypto.createHash("md5").update(`${prompt}-${role}-${JSON.stringify(context)}`).digest("hex");
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    console.log("Neural Optimization: Cache Hit for Orchestration");
    return res.json({ text: cachedResult, source: "neural_cache" });
  }

  try {
    const roles: Record<string, string> = {
      developer: "You are the Aigent Developer at Aigent.ai. You generate high-quality code (frontend, backend, APIs). Return only code or technical explanations.",
      designer: "You are the Aigent Designer at Aigent.ai. You focus on UI/UX, glassmorphism, and modern aesthetics. Provide design specs or component code.",
      pm: "You are the Aigent Project Manager. You plan tasks, break down prompts into actionable steps for other agents.",
      qa: "You are the Aigent QA Tester. You find bugs and suggest fixes.",
      market: "You are the Aigent Marketing Manager. You create copy, SEO tags, and social content.",
      debugger: "You are the Aigent Debugger. Analyze the provided code for errors and provide fixed versions.",
      explainer: "You are the Aigent Code Explainer. Explain the logic and flow of the provided code in simple terms.",
      improver: "You are the Aigent UI Improver. Suggest enhancements for responsiveness, accessibility, and modern aesthetics.",
      security: "You are the Aigent Security Officer. Audit the code for common vulnerabilities (OWASP) and suggest improvements.",
      finance: "You are the Aigent Finance Manager. Help with business models, pricing strategies, and revenue projections for the app.",
    };

    const systemInstruction = roles[role as keyof typeof roles] || "You are an autonomous AI Agent at Aigent.ai, a next-gen AI Business Engine.";

    // Optimization: Prune Context to reduce token noise
    let neuralPrompt = prompt;
    if (context && typeof context === 'string') {
      const pruned = pruneContext(context);
      neuralPrompt = `Context (Pruned):\n${pruned}\n\nUser Request: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: neuralPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Cache the successful result
    cache.set(cacheKey, response.text, 1800); // 30 min cache

    res.json({ text: response.text, source: "neural_generative" });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// Contact Form Endpoint
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const adminSdk = await import("firebase-admin");
    if (!adminSdk.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;
      if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        adminSdk.initializeApp({
          credential: serviceAccount
            ? adminSdk.credential.cert(serviceAccount)
            : adminSdk.credential.applicationDefault(),
        });
      }
    }
    const db = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (db) {
      await db.collection("contacts").add({
        name,
        email,
        subject,
        message,
        createdAt: new Date().toISOString(),
      });
    } else {
      console.log("Contact Form Submission (no Firestore):", { name, email, subject, message });
    }
    recordAuditLog("contact_submission", email, `From ${name}: ${subject}`);
    res.json({ status: "ok", message: "Message received" });
  } catch (error: any) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: error.message });
  }
});

// App Building Endpoint (Complex)
app.post("/api/ai/build", async (req, res) => {
  const { prompt } = req.body;
  const ai = await getAI();

  if (!ai) {
    return res.status(503).json({ error: "AI_SERVICE_UNAVAILABLE" });
  }

  try {
    // Stage 1: PM planning
    const planResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Create a file structure and technical plan for: ${prompt}. Return a JSON structure.`,
      config: {
        systemInstruction: "You are the AI Project Manager. Plan the app architecture.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["path", "description"]
              }
            }
          },
          required: ["files"]
        }
      }
    });

    const plan = JSON.parse(planResponse.text);

    // Stage 2: Generate file contents
    const files: Record<string, string> = {};
    const filePromises = plan.files.map(async (file: { path: string; description: string }) => {
      const fileResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate the complete source code for the file "${file.path}" in this project: ${prompt}. File purpose: ${file.description}. Return ONLY the raw code, no explanations or markdown fences.`,
        config: {
          systemInstruction: "You are an expert developer. Generate production-ready, complete source code for the specified file. Return only the code content, nothing else.",
        }
      });
      files[file.path] = fileResponse.text.replace(/^```[\w]*\n?/gm, "").replace(/\n?```$/gm, "").trim();
    });

    await Promise.all(filePromises);

    res.json({ plan, files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- PayPal Neural Payment Infrastructure ---
let paypalClientInstance: any = null;

const getPayPalClient = async () => {
  if (paypalClientInstance) return paypalClientInstance;

  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || "";

  if (!clientId || !clientSecret || clientId === "sb") {
    return null;
  }

  try {
    const pp = await getPayPalSDK();
    const mode = (process.env.PAYPAL_MODE || "live").toLowerCase();
    const environment = mode === "live"
      ? new pp.core.LiveEnvironment(clientId, clientSecret)
      : new pp.core.SandboxEnvironment(clientId, clientSecret);

    console.log(`Neural Infrastructure: PayPal initializing in ${mode} mode.`);
    paypalClientInstance = new pp.core.PayPalHttpClient(environment);
    return paypalClientInstance;
  } catch (err) {
    console.error("PayPal Infrastructure Critical Error:", err);
    return null;
  }
};

// Create PayPal Order
app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const client = await getPayPalClient();
    if (!client) {
      console.error("PayPal Order Error: Client Not Configured");
      return res.status(503).json({ error: "PAYPAL_NOT_CONFIGURED" });
    }

    const { amount, planName } = req.body;
    const pp = await getPayPalSDK();

    const request = new pp.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: amount
        },
        description: `Aigent.ai - ${planName} Subscription`
      }]
    });

    const order = await client.execute(request);
    console.log(`PayPal Order Created: ${order.result.id}`);
    res.json({ id: order.result.id });
  } catch (err: any) {
    console.error("PayPal Order Execution Failure:", {
      message: err.message,
      statusCode: err.statusCode,
      details: err.result || err.details
    });
    res.status(500).json({ 
      error: "PAYMENT_EXECUTION_FAILURE", 
      message: err.message,
      code: err.statusCode
    });
  }
});

// Capture PayPal Order
app.post("/api/paypal/capture-order", async (req, res) => {
  const client = await getPayPalClient();
  if (!client) {
    return res.status(503).json({ error: "PAYPAL_NOT_CONFIGURED" });
  }

  const { orderId, userId, planName } = req.body;
  const pp = await getPayPalSDK();

  const request = new pp.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);

    // Persist subscription to Firestore
    if (userId && capture.result.status === "COMPLETED") {
      try {
        const adminSdk = await import("firebase-admin");
        if (!adminSdk.apps.length) {
          const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;
          if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
            adminSdk.initializeApp({
              credential: serviceAccount
                ? adminSdk.credential.cert(serviceAccount)
                : adminSdk.credential.applicationDefault(),
            });
          }
        }
        const db = adminSdk.apps.length ? adminSdk.firestore() : null;
        if (db) {
          await db.collection("users").doc(userId).set({
            subscription: (planName || "scale").toLowerCase(),
            subscriptionUpdatedAt: new Date().toISOString(),
            paymentMethod: "paypal",
            lastOrderId: orderId,
          }, { merge: true });

          // Record transaction for billing history
          const amount = capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "0";
          await db.collection("users").doc(userId).collection("transactions").add({
            amount,
            plan: planName || "Scale",
            status: "completed",
            paymentMethod: "paypal",
            orderId,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (firestoreErr) {
        console.error("Failed to persist PayPal subscription:", firestoreErr);
      }
      recordAuditLog("payment_completed", userId, `PayPal ${planName || "subscription"} — Order ${orderId}`);
    }

    res.json({ status: capture.result.status, details: capture.result });
  } catch (err: any) {
    console.error("PayPal Capture Error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/razorpay/create-order", async (req, res) => {
  const { planName } = req.body;
  const rzp = await getRazorpay();

  if (!rzp) {
    return res.status(503).json({ error: "RAZORPAY_NOT_CONFIGURED" });
  }

  try {
    const normalizedPlan = (planName || "Scale").toLowerCase();
    const PLAN_AMOUNT_MAP: Record<string, number> = {
      scale: 69,
      enterprise: 299,
    };
    const amountInWholeUnits = PLAN_AMOUNT_MAP[normalizedPlan] ?? 0;
    const currency = "USD";

    const options = {
      amount: amountInWholeUnits * 100,
      currency,
      receipt: `aigent_${normalizedPlan}_${Date.now()}`,
      notes: {
        planName: normalizedPlan,
        aigentSession: Date.now().toString(),
      },
    };

    const order = await rzp.orders.create(options);
    res.json({
      ...order,
      currency,
      amount: order.amount / 100,
      planName: normalizedPlan,
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", {
      message: error.message,
      code: error.code,
      params: error.params,
    });
    res.status(500).json({
      error: "RAZORPAY_ORDER_FAILED",
      message: error.message,
      code: error.code,
    });
  }
});

// Razorpay Webhook Endpoint (supports international payments)
app.post("/api/razorpay/webhook", async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(503).json({ error: "WEBHOOK_SECRET_NOT_CONFIGURED" });
  }

  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing signature header" });
    }

    // Use raw body buffer for signature verification - important for international transactions
    const body = req.body;
    if (!body || !body.event) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Razorpay Webhook: Invalid signature received");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Process supported events
    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity;

    console.log(`Razorpay Webhook Event Received: ${event}`);

    if (paymentEntity) {
      console.log("Payment Details:", {
        id: paymentEntity.id,
        amount: paymentEntity.amount / 100,
        currency: paymentEntity.currency,
        status: paymentEntity.status,
        method: paymentEntity.method,
        international: paymentEntity.international || false
      });

      // Handle international payment specific logic
      if (paymentEntity.international) {
        console.log("International payment detected - processing with special handling");
        // Additional logic for international payments can be added here
      }

      // Process different payment statuses
      switch (paymentEntity.status) {
        case "captured":
          console.log("Payment captured successfully:", paymentEntity.id);
          // Record successful international payment
          if (paymentEntity.international) {
            recordAuditLog("international_payment_completed", paymentEntity.email || "unknown",
              `Razorpay International Payment: ${paymentEntity.amount/100} ${paymentEntity.currency} — ID: ${paymentEntity.id}`);
          }
          break;

        case "failed":
        case "refunded":
          console.log(`Payment ${paymentEntity.status}:`, paymentEntity.id);
          recordAuditLog("payment_failed", paymentEntity.email || "unknown",
            `Razorpay Payment ${paymentEntity.status}: ${paymentEntity.amount/100} ${paymentEntity.currency} — ID: ${paymentEntity.id}`);
          break;

        default:
          console.log("Unsupported payment status:", paymentEntity.status);
      }
    }

    res.json({ status: "ok" });
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    res.status(500).json({ error: "WEBHOOK_PROCESSING_FAILED", message: error.message });
  }
});

app.post("/api/razorpay/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planName } = req.body;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || ""; // Removed VITE_ prefix - server-side only

  if (!key_secret) {
    return res.status(401).json({ error: "RAZORPAY_SECRET_MISSING" });
  }

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", key_secret)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Persist subscription to Firestore
    if (userId) {
      try {
        const adminSdk = await import("firebase-admin");
        if (!adminSdk.apps.length) {
          const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;
          if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
            adminSdk.initializeApp({
              credential: serviceAccount
                ? adminSdk.credential.cert(serviceAccount)
                : adminSdk.credential.applicationDefault(),
            });
          }
        }
        const db = adminSdk.apps.length ? adminSdk.firestore() : null;
        if (db) {
          await db.collection("users").doc(userId).set({
            subscription: (planName || "scale").toLowerCase(),
            subscriptionUpdatedAt: new Date().toISOString(),
            paymentMethod: "razorpay",
            lastOrderId: razorpay_order_id,
          }, { merge: true });

          // Record transaction for billing history
          await db.collection("users").doc(userId).collection("transactions").add({
            amount: "0", // Razorpay doesn't return amount in verify; client should pass it
            plan: planName || "Scale",
            status: "completed",
            paymentMethod: "razorpay",
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (firestoreErr) {
        console.error("Failed to persist Razorpay subscription:", firestoreErr);
      }
      recordAuditLog("payment_completed", userId, `Razorpay ${planName || "subscription"} — Order ${razorpay_order_id}`);
    }
    return res.json({ status: "ok" });
  } else {
    return res.status(400).json({ error: "Invalid signature" });
  }
});

// --- Email Endpoint (Resend) ---
app.post("/api/email/send", async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields: to, subject, body" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (subject.length > 200) {
    return res.status(400).json({ error: "Subject too long (max 200 chars)" });
  }
  if (body.length > 10000) {
    return res.status(400).json({ error: "Body too long (max 10000 chars)" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(503).json({ error: "EMAIL_SERVICE_NOT_CONFIGURED" });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    await resend.emails.send({
      to,
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      subject,
      text: body,
      html: `<div style="font-family: sans-serif; line-height: 1.6;">${body.replace(/\n/g, "<br>")}</div>`,
    });
    res.json({ status: "ok", message: "Email sent" });
  } catch (err: any) {
    console.error("Resend error:", err);
    res.status(500).json({ error: "EMAIL_SEND_FAILED", details: err.message });
  }
});

// --- Task Execution Endpoint (Autonomous Agents) ---
app.post("/api/tasks/execute", async (req, res) => {
  const ai = await getAI();
  if (!ai) {
    return res.status(503).json({ error: "AI_SERVICE_UNAVAILABLE" });
  }

  try {
    const adminSdk = await import("firebase-admin");
    if (!adminSdk.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;
      if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        adminSdk.initializeApp({
          credential: serviceAccount
            ? adminSdk.credential.cert(serviceAccount)
            : adminSdk.credential.applicationDefault(),
        });
      }
    }
    const db = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (!db) {
      return res.status(503).json({ error: "FIRESTORE_NOT_AVAILABLE" });
    }

    // Fetch all pending tasks
    const companiesSnap = await db.collection("companies").get();
    let executed = 0;

    for (const companyDoc of companiesSnap.docs) {
      const tasksSnap = await companyDoc.ref.collection("tasks").where("status", "==", "pending").get();

      for (const taskDoc of tasksSnap.docs) {
        const task = taskDoc.data();
        await taskDoc.ref.update({ status: "running" });

        try {
          const visionContext = companyDoc.data().vision ? `Company Vision: ${companyDoc.data().vision}\n` : "";
          const roles: Record<string, string> = {
            developer: "You are the Aigent Developer. Generate code or technical solutions.",
            designer: "You are the Aigent Designer. Focus on UI/UX improvements.",
            pm: "You are the Aigent Project Manager. Plan and organize tasks.",
            market: "You are the Aigent Marketing Manager. Create marketing content.",
            security: "You are the Aigent Security Officer. Audit for vulnerabilities.",
            finance: "You are the Aigent Finance Manager. Analyze business metrics.",
          };

          const systemPrompt = roles[task.agent] || roles.developer;
          const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: visionContext + task.prompt }] }],
            config: { systemInstruction: systemPrompt },
          });

          const text = result.text || "No response generated";
          await taskDoc.ref.update({
            status: "completed",
            result: text,
            lastRunAt: new Date().toISOString(),
          });
          executed++;
        } catch (err) {
          await taskDoc.ref.update({ status: "failed", lastRunAt: new Date().toISOString() });
        }
      }
    }

    res.json({ status: "ok", executed });
  } catch (err: any) {
    console.error("Task execution error:", err);
    res.status(500).json({ error: "TASK_EXECUTION_FAILED" });
  }
});

// --- Deploy to GitHub ---
app.post("/api/deploy/github", async (req, res) => {
  res.status(410).json({ error: "DEPLOY_ENDPOINT_DEPRECATED", message: "Use /api/deploy/ai instead" });
});

app.post("/api/deploy/vercel", async (req, res) => {
  res.status(410).json({ error: "DEPLOY_ENDPOINT_DEPRECATED", message: "Use /api/deploy/ai instead" });
});

// Unified deploy endpoint with safety checks
app.post("/api/deploy/ai", async (req, res) => {
  const { target, repo, branch = "main", companyId } = req.body;

  const allowedTargets = ["github", "vercel"];
  if (!allowedTargets.includes(target)) {
    return res.status(400).json({ error: "INVALID_DEPLOY_TARGET", allowedTargets });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const vercelToken = process.env.VERCEL_TOKEN;

  if (target === "github" && !githubToken) {
    return res.status(503).json({ error: "GITHUB_TOKEN_NOT_CONFIGURED" });
  }
  if (target === "vercel" && !vercelToken) {
    return res.status(503).json({ error: "VERCEL_TOKEN_NOT_CONFIGURED" });
  }

  try {
    let result: { url?: string; fileCount?: number; status: string; target: string } = { status: "unknown", target };

    if (target === "github") {
      const adminSdk = await import("firebase-admin");
      const db = adminSdk.apps.length ? adminSdk.firestore() : null;
      let files: Record<string, string> = {};

      if (db && companyId) {
        const projectsSnap = await db.collection("projects")
          .where("ownerId", "==", companyId)
          .limit(1)
          .get();

        if (!projectsSnap.empty) {
          files = projectsSnap.docs[0].data().files || {};
        }
      }

      if (Object.keys(files).length === 0) {
        return res.status(400).json({ error: "NO_FILES_FOUND_TO_DEPLOY" });
      }

      const headers = {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };

      for (const [path, content] of Object.entries(files)) {
        const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
        let sha: string | undefined;
        try {
          const existing = await fetch(apiUrl, { headers });
          if (existing.ok) {
            const data = (await existing.json()) as { sha?: string };
            sha = data.sha;
          }
        } catch {
          // continue without sha for new files
        }

        await fetch(apiUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `feat: deploy ${path}`,
            content: Buffer.from(content).toString("base64"),
            ...(sha ? { sha } : {}),
            branch,
          }),
        });
      }

      result = {
        url: `https://github.com/${repo}`,
        fileCount: Object.keys(files).length,
        status: "success",
        target,
      };
    } else if (target === "vercel") {
      const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repo || `aigent-project-${Date.now()}`,
          gitSource: { type: "github", repo, ref: branch },
        }),
      });

      if (!deployRes.ok) {
        const err = await deployRes.json();
        return res.status(400).json({ error: "VERCEL_DEPLOY_FAILED", details: err });
      }

      const deployData = (await deployRes.json()) as { url?: string };
      result = {
        url: `https://${deployData.url}`,
        status: "success",
        target,
      };
    }

    if (companyId) {
      const adminSdk2 = await import("firebase-admin");
      const db2 = adminSdk2.apps.length ? adminSdk2.firestore() : null;
      if (db2) {
        await db2.collection("companies").doc(companyId).collection("deploys").add({
          ...result,
          createdAt: new Date().toISOString(),
        });
      }
    }

    res.json(result);
  } catch (err: any) {
    console.error("AI Deploy Error:", err);
    res.status(500).json({ error: "DEPLOY_FAILED", details: err.message });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Neural Optimization: Vite Dev Middleware Mounted");
    } catch (e) {
      console.warn("Vite Dev Server failed to load, falling back to static (Non-critical in production)");
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Only bootstraps the dev/static server if NOT in a serverless or test environment
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  setupVite();
}

export default app;
