import { describe, it, expect } from "vitest";
import request from "supertest";
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
  it("responde 501 até implementação do domínio", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ type: "SALE", items: [{ productVariantId: "x", quantity: 1 }] });
    expect(res.status).toBe(501);
    expect(res.body.error).toBe("not_implemented");
  });
});
