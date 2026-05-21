import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../server";

describe("Server endpoints", () => {
  describe("GET /api/health", () => {
    it("returns 200 with status ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.timestamp).toBeTruthy();
      expect(res.body.services).toBeDefined();
      expect(res.body.services.gemini).toBeDefined();
      expect(res.body.services.paypal).toBeDefined();
      expect(res.body.services.razorpay).toBeDefined();
      expect(res.body.services.cache).toBeDefined();
      expect(res.body.version).toBe("1.2.2-neural");
    });
  });

  describe("GET /api/config", () => {
    it("returns 200 with config fields", async () => {
      const res = await request(app).get("/api/config");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("paypalClientId");
      expect(res.body).toHaveProperty("razorpayKeyId");
      expect(res.body).toHaveProperty("serverMode");
    });
  });

  describe("POST /api/ai/orchestrate", () => {
    it("returns 400 when prompt is missing (with API key)", async () => {
      // When GEMINI_API_KEY is not set, server returns 503 first
      // When it IS set, it validates the prompt and returns 400
      const res = await request(app)
        .post("/api/ai/orchestrate")
        .send({ role: "developer" });
      if (!process.env.GEMINI_API_KEY) {
        expect(res.status).toBe(503);
      } else {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Prompt is required");
      }
    });

    it("returns 503 when GEMINI_API_KEY is not set", async () => {
      const res = await request(app)
        .post("/api/ai/orchestrate")
        .send({ role: "developer", prompt: "write a function" });
      // If GEMINI_API_KEY is not set, should return 503
      // If it IS set, it'll actually call Gemini (integration behavior)
      if (!process.env.GEMINI_API_KEY) {
        expect(res.status).toBe(503);
        expect(res.body.error).toBe("AI_SERVICE_UNAVAILABLE");
      }
    });
  });

  describe("POST /api/contact", () => {
    it("returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Test" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    it("returns 200 on valid contact submission", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({
          name: "Test User",
          email: "test@example.com",
          subject: "Test",
          message: "Hello"
        });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("GET /unknown-route", () => {
    it("does not crash", async () => {
      const res = await request(app).get("/unknown-route");
      // Returns either 404 or the SPA index.html
      expect(res.status).toBeLessThan(500);
    });
  });
});
