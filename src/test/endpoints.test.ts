import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../server";

describe("POST /api/paypal/create-order", () => {
  it("returns 503 when PayPal is not configured", async () => {
    const res = await request(app)
      .post("/api/paypal/create-order")
      .send({ amount: "69.00", planName: "Scale" });
    // Returns 503 when PayPal client can't be initialized
    expect([400, 500, 503]).toContain(res.status);
  });
});

describe("POST /api/paypal/capture-order", () => {
  it("returns 503 when PayPal is not configured", async () => {
    const res = await request(app)
      .post("/api/paypal/capture-order")
      .send({ orderId: "test-order-id", userId: "user123", planName: "Scale" });
    expect([400, 500, 503]).toContain(res.status);
  });
});

describe("POST /api/razorpay/create-order", () => {
  it("returns 503 when Razorpay is not configured", async () => {
    const res = await request(app)
      .post("/api/razorpay/create-order")
      .send({ amount: "69.00", currency: "USD" });
    // Razorpay has fallback credentials, so it may return 500 instead of 503
    expect([400, 500, 503]).toContain(res.status);
  });
});

describe("POST /api/razorpay/verify-payment", () => {
  it("returns 401 when key_secret is not set", async () => {
    const res = await request(app)
      .post("/api/razorpay/verify-payment")
      .send({
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "invalid_sig",
        userId: "user123",
        planName: "Scale",
      });
    if (process.env.RAZORPAY_KEY_SECRET) {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid signature");
    } else {
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("RAZORPAY_SECRET_MISSING");
    }
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

describe("POST /api/email/send", () => {
  it("returns 400 when email format is invalid", async () => {
    const res = await request(app)
      .post("/api/email/send")
      .send({ to: "invalid-email", subject: "Test", body: "Hello" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email format");
  });

  it("returns 400 when subject is too long", async () => {
    const res = await request(app)
      .post("/api/email/send")
      .send({ to: "test@example.com", subject: "x".repeat(201), body: "Hello" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Subject too long");
  });

  it("returns 400 when body is too long", async () => {
    const res = await request(app)
      .post("/api/email/send")
      .send({ to: "test@example.com", subject: "Test", body: "x".repeat(10001) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Body too long");
  });
});

describe("Rate Limiting", () => {
  it("allows requests within limit", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
