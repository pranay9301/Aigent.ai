import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../server";

describe("Server endpoints", () => {
  describe("GET /api/health", () => {
    it("returns 200 with status ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.services).toBeDefined();
      expect(res.body.services.razorpay).toBeDefined();
      expect(res.body.services.cache).toBeDefined();
    });
  });

  describe("GET /api/config", () => {
    it("returns 200 with config fields", async () => {
      const res = await request(app).get("/api/config");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("razorpayKeyId");
      expect(res.body).toHaveProperty("serverMode");
    });
  });

  describe("POST /api/contact", () => {
    it("returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/contact")
        .send({ name: "Test" });
      expect(res.status).toBe(400);
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
      expect(res.status).toBeLessThan(500);
    });
  });

  describe("POST /api/tasks/execute", () => {
    it("returns 503 when GEMINI_API_KEY is not set", async () => {
      const res = await request(app)
        .post("/api/tasks/execute")
        .send({});
      const aiStatusCode = res.status === 200 ? 503 : res.status;
      expect([400, 401, 403, 404, 422, 429, 500, 503]).toContain(res.status);
      if (!process.env.GEMINI_API_KEY || aiStatusCode >= 500) {
        expect(res.status).toBe(503);
        expect(res.body.error).toBe("AI_SERVICE_UNAVAILABLE");
      }
    });
  });

  describe("POST /api/deploy/vercel", () => {
    it("returns 503 when VERCEL_TOKEN is not set", async () => {
      const res = await request(app)
        .post("/api/deploy/vercel")
        .send({ repo: "my-project" });
      if (!process.env.VERCEL_TOKEN) {
        expect(res.status).toBe(503);
        expect(res.body.error).toBe("VERCEL_TOKEN_NOT_CONFIGURED");
      }
    });
  });
});
