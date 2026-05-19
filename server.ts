import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { pruneContext, cache } from "./src/lib/neural-optim";

dotenv.config();

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
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
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
        rezorpay: !!process.env.RAZORPAY_KEY_ID ? "healthy" : "idle"
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
    const paypalId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
    const razorpayId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
    
    res.json({
      paypalClientId: paypalId,
      razorpayKeyId: razorpayId,
      isPaypalLive: process.env.PAYPAL_MODE === "live",
      serverMode: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({ error: "CONFIG_ERROR" });
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

    // Stage 2: Parallel generation (simplified for now)
    // In a real app we'd iterate and generate each file.
    
    res.json({ plan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- PayPal Neural Payment Infrastructure ---
let paypalClientInstance: any = null;

const getPayPalClient = async () => {
  if (paypalClientInstance) return paypalClientInstance;

  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret || clientId === "sb") {
    return null;
  }

  try {
    const pp = await getPayPalSDK();
    const environment = process.env.PAYPAL_MODE === "live"
      ? new pp.core.LiveEnvironment(clientId, clientSecret)
      : new pp.core.SandboxEnvironment(clientId, clientSecret);
      
    paypalClientInstance = new pp.core.PayPalHttpClient(environment);
    return paypalClientInstance;
  } catch (err) {
    console.error("PayPal Initialization Error:", err);
    return null;
  }
};

// Create PayPal Order
app.post("/api/paypal/create-order", async (req, res) => {
  const client = await getPayPalClient();
  if (!client) {
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

  try {
    const order = await client.execute(request);
    console.log(`PayPal Order Created: ${order.result.id}`);
    res.json({ id: order.result.id });
  } catch (err: any) {
    console.error("PayPal Order Execution Error:", {
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

// --- Razorpay Neural Payment Infrastructure ---
let razorpayInstance: any = null;

app.post("/api/razorpay/create-order", async (req, res) => {
  const { amount, currency = "USD" } = req.body;
  const rzp = await getRazorpay();

  if (!rzp) {
    return res.status(503).json({ error: "RAZORPAY_NOT_CONFIGURED" });
  }

  try {
    const options = {
      amount: Math.round(parseFloat(amount) * 100), // amount in the smallest currency unit
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await rzp.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/razorpay/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

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

export default app;

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

  // Only listen if not running in a serverless environment
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupVite();
