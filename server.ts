import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import paypal from "@paypal/checkout-server-sdk";
import Razorpay from "razorpay";
import crypto from "crypto";
import { pruneContext, cache } from "./src/lib/neural-optim";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes go here FIRST
app.get("/api/health", (req, res) => {
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      gemini: process.env.GEMINI_API_KEY ? "healthy" : "disconnected",
      paypal: paypalClient ? "healthy" : "disconnected",
      razorpay: process.env.RAZORPAY_KEY_ID ? "healthy" : "idle"
    },
    version: "1.2.0-neural"
  };
  res.json(healthStatus);
});

app.get("/api/config", (req, res) => {
  res.json({
    paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    isPaypalLive: process.env.PAYPAL_MODE === "live"
  });
});

// AI Agent Orchestration Endpoint
app.post("/api/ai/orchestrate", async (req, res) => {
  const { prompt, context, role } = req.body;

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

const configurePayPal = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn("PAYPAL_CREDENTIALS_MISSING: Payment system is in idle mode.");
    return null;
  }

  const environment = process.env.PAYPAL_MODE === "live"
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    
  return new paypal.core.PayPalHttpClient(environment);
};

const paypalClient = configurePayPal();

// Create PayPal Order
app.post("/api/paypal/create-order", async (req, res) => {
  if (!paypalClient) {
    return res.status(503).json({ error: "PAYPAL_NOT_CONFIGURED" });
  }

  const { amount, planName } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
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
    const order = await paypalClient.execute(request);
    res.json({ id: order.result.id });
  } catch (err: any) {
    console.error("PayPal Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Capture PayPal Order
app.post("/api/paypal/capture-order", async (req, res) => {
  if (!paypalClient) {
    return res.status(503).json({ error: "PAYPAL_NOT_CONFIGURED" });
  }

  const { orderId } = req.body;

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    // In a real app, you would update the user's subscription status in Firestore here
    res.json({ status: capture.result.status, details: capture.result });
  } catch (err: any) {
    console.error("PayPal Capture Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Razorpay Neural Payment Infrastructure ---

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

app.post("/api/razorpay/create-order", async (req, res) => {
  const { amount, currency = "USD" } = req.body;

  try {
    const options = {
      amount: Math.round(parseFloat(amount) * 100), // amount in the smallest currency unit
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/razorpay/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not running in a serverless environment
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupVite();
