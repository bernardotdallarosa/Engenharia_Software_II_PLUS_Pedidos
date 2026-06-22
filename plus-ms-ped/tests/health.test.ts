import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { sign } from "jsonwebtoken";
import { app } from "../src/app";
import { orderRepository } from "../src/repositories/orderRepository";

const makeToken = (role: "admin" | "vendedor") => {
  process.env.JWT_SECRET = "test-secret";
  return sign(
    { sub: role === "admin" ? "admin@example.com" : "vendedor@example.com", role, user_id: 1 },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

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
    const token = makeToken("vendedor");

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "SALE", items: [] });

    expect(res.status).toBe(400);
  });
});

describe("POST /orders/:orderId/reserve", () => {
  it("retorna 404 quando pedido não existe", async () => {
    vi.spyOn(orderRepository, "getOrderById").mockResolvedValue(null);
    const token = makeToken("admin");

    const res = await request(app)
      .post("/orders/order-not-found/reserve")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /orders/:orderId/status", () => {
  it("retorna 409 para transição inválida", async () => {
    vi.spyOn(orderRepository, "getOrderById").mockResolvedValue({
      id: "order-1",
      type: "SALE",
      status: "COMPLETED",
      items: [],
      supplierRef: null,
      notes: null,
      createdBy: "vendedor@example.com",
      reservedAt: null,
      confirmedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = makeToken("admin");
    const res = await request(app)
      .patch("/orders/order-1/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(409);
  });

  it("permite vendedor confirmar pedido SALE", async () => {
    vi.spyOn(orderRepository, "getOrderById").mockResolvedValue({
      id: "order-1",
      type: "SALE",
      status: "DRAFT",
      items: [],
      supplierRef: null,
      notes: null,
      createdBy: "vendedor@example.com",
      reservedAt: null,
      confirmedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(orderRepository, "updateOrderStatus").mockResolvedValue({
      id: "order-1",
      type: "SALE",
      status: "CONFIRMED",
      items: [],
      supplierRef: null,
      notes: null,
      createdBy: "vendedor@example.com",
      reservedAt: null,
      confirmedAt: new Date(),
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = makeToken("vendedor");
    const res = await request(app)
      .patch("/orders/order-1/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONFIRMED");
  });

  it("bloqueia vendedor ao confirmar pedido PURCHASE", async () => {
    vi.spyOn(orderRepository, "getOrderById").mockResolvedValue({
      id: "order-2",
      type: "PURCHASE",
      status: "DRAFT",
      items: [],
      supplierRef: null,
      notes: null,
      createdBy: "admin@example.com",
      reservedAt: null,
      confirmedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = makeToken("vendedor");
    const res = await request(app)
      .patch("/orders/order-2/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(403);
  });
});

describe("POST /orders/:orderId/cancel", () => {
  it("retorna 403 quando vendedor tenta cancelar pedido de outro", async () => {
    vi.spyOn(orderRepository, "getOrderById").mockResolvedValue({
      id: "order-1",
      type: "SALE",
      status: "DRAFT",
      items: [],
      supplierRef: null,
      notes: null,
      createdBy: "outro@example.com",
      reservedAt: null,
      confirmedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = makeToken("vendedor");
    const res = await request(app)
      .post("/orders/order-1/cancel")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe("GET /orders", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejeita listagem sem token", async () => {
    const res = await request(app).get("/orders");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("unauthorized");
  });

  it("lista pedidos com token válido", async () => {
    vi.spyOn(orderRepository, "listOrders").mockResolvedValue({
      items: [
        {
          id: "order-1",
          type: "SALE",
          status: "DRAFT",
          items: [{ id: "item-1", productVariantId: "variant-1", quantity: 1 }],
          supplierRef: null,
          notes: null,
          createdBy: "vendedor@example.com",
          reservedAt: null,
          confirmedAt: null,
          completedAt: null,
          cancelledAt: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    const token = makeToken("vendedor");
    const res = await request(app)
      .get("/orders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it("retorna 404 para pedido inexistente", async () => {
    vi.spyOn(orderRepository, "getOrderById").mockResolvedValue(null);

    const token = makeToken("admin");
    const res = await request(app)
      .get("/orders/order-not-found")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
