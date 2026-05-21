import express from "express";
import path from "path";
import { Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { pruneContext, cache, setPersistFn } from "./src/lib/neural-optim";
import { persistCacheEntry } from "./src/lib/server-cache";

dotenv.config();

// Wire Firestore cache persistence
setPersistFn(persistCacheEntry);

const app = express();
const PORT = 3000;

app.use(express.json());

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
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SpCXyw5DStKC5o";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || "Q2Po6EULQ5qsziBNOV9i4C9f";
  if (!key_id || !key_secret) return null;
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
    const healthStatus = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        gemini: !!process.env.GEMINI_API_KEY ? "healthy" : "disconnected",
        paypal: !!paypalId ? "connected" : "disconnected",
        razorpay: !!(process.env.RAZORPAY_KEY_ID || "rzp_live_SpCXyw5DStKC5o") ? "healthy" : "idle",
        cache: !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_PROJECT_ID) ? "persisted" : "in-memory"
      },
      env: {
        node: process.version,
        mode: process.env.NODE_ENV,
        has_paypal_secret: !!process.env.PAYPAL_CLIENT_SECRET
      },
      version: "1.2.2-neural"
    };
    res.json(healthStatus);
  } catch (err) {
    res.status(500).json({ error: "Health check failed" });
  }
});

app.get("/api/config", (req, res) => {
  try {
    const paypalId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "AUgGGIucZj-6Ob_b2NyrZw9Uv7WwTaw80TPlgM8Xj-ElO6Snknk42NL2mJ7ofeG1wRAn8E-vFOQHhjWr";
    const paypalSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || "EHl6F59RBHFdAqYpb7aIQ01fFEGa0SR5vBoIOiBI3OmLCev3DVuAnNTKpkbiLhb2DQBI-8s7mX24c3ji";
    const razorpayId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SpCXyw5DStKC5o";

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
      model: "gemini-3-flash-preview",
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
  try {
    console.log("Contact Form Submission:", { name, email, subject, message, timestamp: new Date().toISOString() });
    res.json({ status: "ok", message: "Message received" });
  } catch (error: any) {
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
      model: "gemini-3-flash-preview",
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
        model: "gemini-3-flash-preview",
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

  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "AUgGGIucZj-6Ob_b2NyrZw9Uv7WwTaw80TPlgM8Xj-ElO6Snknk42NL2mJ7ofeG1wRAn8E-vFOQHhjWr";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || "EHl6F59RBHFdAqYpb7aIQ01fFEGa0SR5vBoIOiBI3OmLCev3DVuAnNTKpkbiLhb2DQBI-8s7mX24c3ji";

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

  const { orderId } = req.body;
  const pp = await getPayPalSDK();

  const request = new pp.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    // In a real app, you would update the user's subscription status in Firestore here
    res.json({ status: capture.result.status, details: capture.result });
  } catch (err: any) {
    console.error("PayPal Capture Error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/razorpay/create-order", async (req, res) => {
  const { amount, currency = "USD" } = req.body;
  const rzp = await getRazorpay();

  if (!rzp) {
    return res.status(503).json({ error: "RAZORPAY_NOT_CONFIGURED" });
  }

  try {
    // Razorpay supports: USD, EUR, GBP, INR, SGD, AUD, CAD, etc.
    const supportedCurrencies = ["USD", "INR", "EUR", "GBP", "SGD", "AUD", "CAD", "AED", "MYR", "NZD"];
    const finalCurrency = supportedCurrencies.includes(currency.toUpperCase()) ? currency.toUpperCase() : "USD";

    const options = {
      amount: Math.round(parseFloat(amount) * 100),
      currency: finalCurrency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await rzp.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Razorpay Webhook Endpoint
app.post("/api/razorpay/webhook", (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(503).json({ error: "WEBHOOK_SECRET_NOT_CONFIGURED" });
  }

  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (signature === expectedSignature) {
    const event = req.body.event;
    console.log("Razorpay Webhook Event:", event);

    if (event === "payment.captured") {
      console.log("Payment captured:", req.body.payload?.payment?.entity?.id);
    } else if (event === "payment.failed") {
      console.log("Payment failed:", req.body.payload?.payment?.entity?.id);
    }

    res.json({ status: "ok" });
  } else {
    res.status(400).json({ error: "Invalid webhook signature" });
  }
});

app.post("/api/razorpay/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || "Q2Po6EULQ5qsziBNOV9i4C9f";

  if (!key_secret) {
    return res.status(401).json({ error: "RAZORPAY_SECRET_MISSING" });
  }

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", key_secret)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // In a real app, you would update the user's subscription status in Firestore here
    return res.json({ status: "ok" });
  } else {
    return res.status(400).json({ error: "Invalid signature" });
  }
});

// --- Email Endpoint (SendGrid) ---
app.post("/api/email/send", async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields: to, subject, body" });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    return res.status(503).json({ error: "SENDGRID_NOT_CONFIGURED" });
  }

  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    sgMail.setApiKey(sendgridKey);
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@aigent.ai",
      subject,
      text: body,
      html: `<div style="font-family: sans-serif; line-height: 1.6;">${body.replace(/\n/g, "<br>")}</div>`,
    });
    res.json({ status: "ok", message: "Email sent" });
  } catch (err: any) {
    console.error("SendGrid error:", err);
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
            model: "gemini-3-flash-preview",
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
  const { repo, companyId } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.status(503).json({ error: "GITHUB_TOKEN_NOT_CONFIGURED" });
  }

  if (!repo) {
    return res.status(400).json({ error: "Repository name required" });
  }

  try {
    // Fetch company's first project files
    const adminSdk = await import("firebase-admin");
    const db = adminSdk.apps.length ? adminSdk.firestore() : null;
    if (!db) return res.status(503).json({ error: "FIRESTORE_NOT_AVAILABLE" });

    let files: Record<string, string> = {};
    if (companyId) {
      const projectsSnap = await db.collection("projects")
        .where("ownerId", "==", companyId)
        .limit(1)
        .get();
      if (!projectsSnap.empty) {
        files = projectsSnap.docs[0].data().files || {};
      }
    }

    if (Object.keys(files).length === 0) {
      return res.status(400).json({ error: "No files found to deploy" });
    }

    // Push files to GitHub via API
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    for (const [path, content] of Object.entries(files)) {
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
      // Check if file exists to get SHA for update
      let sha: string | undefined;
      try {
        const existing = await fetch(apiUrl, { headers });
        if (existing.ok) {
          const data = await existing.json();
          sha = data.sha;
        }
      } catch {}

      await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `feat: deploy ${path}`,
          content: Buffer.from(content).toString("base64"),
          ...(sha ? { sha } : {}),
        }),
      });
    }

    // Log deploy
    if (companyId) {
      await db.collection("companies").doc(companyId).collection("deploys").add({
        target: "github",
        repo,
        status: "success",
        url: `https://github.com/${repo}`,
        fileCount: Object.keys(files).length,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ status: "ok", url: `https://github.com/${repo}`, fileCount: Object.keys(files).length });
  } catch (err: any) {
    console.error("GitHub deploy error:", err);
    res.status(500).json({ error: "DEPLOY_FAILED", details: err.message });
  }
});

// --- Deploy to Vercel ---
app.post("/api/deploy/vercel", async (req, res) => {
  const { repo, companyId } = req.body;
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    return res.status(503).json({ error: "VERCEL_TOKEN_NOT_CONFIGURED" });
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Create a new Vercel project deployment
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: repo || `aigent-project-${Date.now()}`,
        gitSource: { type: "github", repo, ref: "main" },
      }),
    });

    if (!deployRes.ok) {
      const err = await deployRes.json();
      return res.status(400).json({ error: "VERCEL_DEPLOY_FAILED", details: err });
    }

    const deployData = await deployRes.json();
    const url = `https://${deployData.url}`;

    // Log deploy
    if (companyId) {
      const adminSdk = await import("firebase-admin");
      const db = adminSdk.apps.length ? adminSdk.firestore() : null;
      if (db) {
        await db.collection("companies").doc(companyId).collection("deploys").add({
          target: "vercel",
          repo,
          status: "success",
          url,
          createdAt: new Date().toISOString(),
        });
      }
    }

    res.json({ status: "ok", url, deploymentId: deployData.id });
  } catch (err: any) {
    console.error("Vercel deploy error:", err);
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

// Only bootstraps the dev/static server if NOT in a serverless environment (Vercel)
if (!process.env.VERCEL) {
  setupVite();
}

export default app;
