import { describe, it, expect } from "vitest";
import request from "supertest";
import { sign } from "jsonwebtoken";
import { app } from "../src/app";

describe("GET /health", () => {
  it("retorna status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "plus-ms-ped" });
  });
});

describe("GET /docs", () => {
  it("serve Swagger UI", async () => {
    const res = await request(app).get("/docs/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger");
  });
});

describe("POST /orders", () => {
  it("rejeita pedidos sem token", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ type: "SALE", items: [{ productVariantId: "x", quantity: 1 }] });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("unauthorized");
  });

  it("rejeita pedido com token válido mas payload inválido", async () => {
    process.env.JWT_SECRET = "test-secret";
    const token = sign(
      { sub: "vendedor@example.com", role: "vendedor", user_id: 2 },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "SALE", items: [] });

    expect(res.status).toBe(400);
  });
});
