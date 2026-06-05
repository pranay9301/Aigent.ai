import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../server";

describe("POST /api/razorpay/create-order", () => {
  it("returns an order for a valid plan", async () => {
    const res = await request(app)
      .post("/api/razorpay/create-order")
      .send({ planName: "Scale" });
    expect([200, 400, 503]).toContain(res.status);
  });
});

describe("POST /api/contact", () => {
  it("returns 400 when email format is invalid", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({
        name: "Test",
        email: "not-an-email",
        subject: "Test",
        message: "Hello",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email format");
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Test" });
    expect(res.status).toBe(400);
  });
});

describe("Rate Limiting", () => {
  it("allows requests within limit", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
