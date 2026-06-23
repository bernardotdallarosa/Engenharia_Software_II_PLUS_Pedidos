import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { orderService } from "../src/services/orderService";
import { orderRepository } from "../src/repositories/orderRepository";
import { publishOrderEvent } from "../src/services/orderEventPublisher";

vi.mock("../src/repositories/orderRepository", () => ({
  orderRepository: {
    listOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

vi.mock("../src/services/orderEventPublisher", () => ({
  publishOrderEvent: vi.fn().mockResolvedValue(undefined),
}));

const baseOrder = {
  id: "order-1",
  type: "SALE" as const,
  status: "DRAFT" as const,
  items: [{ id: "item-1", productVariantId: "var-1", quantity: 2 }],
  supplierRef: null,
  notes: null,
  createdBy: "vendedor@example.com",
  reservedAt: null,
  confirmedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const vendedor = { sub: "vendedor@example.com", role: "vendedor", user_id: 1 };
const admin = { sub: "admin@example.com", role: "admin", user_id: 2 };

describe("orderService.createOrder", () => {
  beforeEach(() => {
    vi.mocked(orderRepository.createOrder).mockResolvedValue(undefined);
    vi.mocked(orderRepository.getOrderById).mockResolvedValue(baseOrder);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cria pedido SALE para vendedor", async () => {
    const result = await orderService.createOrder(
      { type: "SALE", items: [{ productVariantId: "var-1", quantity: 1 }] },
      vendedor
    );

    expect(result.status).toBe("DRAFT");
    expect(orderRepository.createOrder).toHaveBeenCalledOnce();
  });

  it("bloqueia PURCHASE para vendedor", async () => {
    await expect(
      orderService.createOrder(
        { type: "PURCHASE", items: [{ productVariantId: "var-1", quantity: 1 }] },
        vendedor
      )
    ).rejects.toThrow("FORBIDDEN");
  });

  it("rejeita items vazios", async () => {
    await expect(
      orderService.createOrder({ type: "SALE", items: [] }, vendedor)
    ).rejects.toThrow("INVALID_REQUEST");
  });

  it("rejeita quantidade inválida", async () => {
    await expect(
      orderService.createOrder(
        { type: "SALE", items: [{ productVariantId: "var-1", quantity: 0 }] },
        vendedor
      )
    ).rejects.toThrow("INVALID_REQUEST");
  });
});

describe("orderService.reserveOrder", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reserva pedido DRAFT e publica order.reserved", async () => {
    vi.mocked(orderRepository.getOrderById).mockResolvedValue(baseOrder);
    vi.mocked(orderRepository.updateOrderStatus).mockResolvedValue({
      ...baseOrder,
      status: "RESERVED",
      reservedAt: new Date(),
    });

    const result = await orderService.reserveOrder("order-1", admin);

    expect(result?.status).toBe("RESERVED");
    expect(publishOrderEvent).toHaveBeenCalledWith("order.reserved", expect.any(Object));
  });

  it("falha se pedido não está em DRAFT", async () => {
    vi.mocked(orderRepository.getOrderById).mockResolvedValue({
      ...baseOrder,
      status: "CONFIRMED",
    });

    await expect(orderService.reserveOrder("order-1", admin)).rejects.toThrow("CONFLICT");
  });
});

describe("orderService.updateOrderStatus", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("confirma pedido e publica order.confirmed", async () => {
    vi.mocked(orderRepository.getOrderById).mockResolvedValue({
      ...baseOrder,
      status: "RESERVED",
    });
    vi.mocked(orderRepository.updateOrderStatus).mockResolvedValue({
      ...baseOrder,
      status: "CONFIRMED",
      confirmedAt: new Date(),
    });

    const result = await orderService.updateOrderStatus(
      "order-1",
      { status: "CONFIRMED" },
      vendedor
    );

    expect(result?.status).toBe("CONFIRMED");
    expect(publishOrderEvent).toHaveBeenCalledWith("order.confirmed", expect.any(Object));
  });

  it("rejeita transição inválida", async () => {
    vi.mocked(orderRepository.getOrderById).mockResolvedValue({
      ...baseOrder,
      status: "COMPLETED",
    });

    await expect(
      orderService.updateOrderStatus("order-1", { status: "CONFIRMED" }, admin)
    ).rejects.toThrow("CONFLICT");
  });
});

describe("orderService.cancelOrder", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cancela pedido RESERVED e publica order.reservation.released", async () => {
    vi.mocked(orderRepository.getOrderById).mockResolvedValue({
      ...baseOrder,
      status: "RESERVED",
      createdBy: vendedor.sub,
    });
    vi.mocked(orderRepository.updateOrderStatus).mockResolvedValue({
      ...baseOrder,
      status: "CANCELLED",
      cancelledAt: new Date(),
    });

    await orderService.cancelOrder("order-1", vendedor);

    expect(publishOrderEvent).toHaveBeenCalledWith(
      "order.reservation.released",
      expect.any(Object)
    );
  });

  it("impede vendedor de cancelar pedido de outro", async () => {
    vi.mocked(orderRepository.getOrderById).mockResolvedValue({
      ...baseOrder,
      createdBy: "outro@example.com",
    });

    await expect(orderService.cancelOrder("order-1", vendedor)).rejects.toThrow("FORBIDDEN");
  });
});
