import { randomUUID } from "crypto";
import { orderRepository } from "../repositories/orderRepository";
import { publishOrderEvent } from "./orderEventPublisher";

type AuthUser = {
  sub: string;
  user_id?: number;
  role: string;
};

type OrderItemInput = {
  productVariantId: string;
  quantity: number;
};

type CreateOrderInput = {
  type?: string;
  supplierRef?: string;
  notes?: string;
  items?: OrderItemInput[];
};

const isOrderType = (value: string): value is "PURCHASE" | "SALE" =>
  value === "PURCHASE" || value === "SALE";

const isOrderStatus = (value: string): value is "DRAFT" | "RESERVED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" =>
  ["DRAFT", "RESERVED", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(value);

const canAccess = (role: string) => role === "admin" || role === "vendedor";

const allowedTransitions: Record<string, string[]> = {
  DRAFT: ["RESERVED", "CONFIRMED", "CANCELLED"],
  RESERVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const orderService = {
  async listOrders(
    params: {
      type?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      pageSize?: number;
    },
    user: AuthUser
  ) {
    if (!canAccess(user.role)) {
      throw new Error("FORBIDDEN");
    }

    const page = Number.isFinite(params.page) ? Number(params.page) : 1;
    const pageSize = Number.isFinite(params.pageSize) ? Number(params.pageSize) : 20;

    return orderRepository.listOrders({
      type: params.type,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page,
      pageSize,
    });
  },

  async getOrderById(orderId: string, user: AuthUser) {
    if (!canAccess(user.role)) {
      throw new Error("FORBIDDEN");
    }

    return orderRepository.getOrderById(orderId);
  },

  async reserveOrder(orderId: string, user: AuthUser) {
    if (!canAccess(user.role)) {
      throw new Error("FORBIDDEN");
    }

    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      throw new Error("NOT_FOUND");
    }

    if (order.status !== "DRAFT") {
      throw new Error("CONFLICT");
    }

    const now = new Date();
    const updated = await orderRepository.updateOrderStatus(orderId, "RESERVED", {
      reservedAt: now,
      updatedAt: now,
    });

    if (updated) {
      await publishOrderEvent("order.reserved", updated);
    }

    return updated;
  },

  async updateOrderStatus(orderId: string, payload: { status?: string }, user: AuthUser) {
    if (!canAccess(user.role)) {
      throw new Error("FORBIDDEN");
    }

    if (!payload || !payload.status || !isOrderStatus(payload.status)) {
      throw new Error("INVALID_REQUEST");
    }

    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      throw new Error("NOT_FOUND");
    }

    const allowed = allowedTransitions[order.status] || [];
    if (!allowed.includes(payload.status)) {
      throw new Error("CONFLICT");
    }

    if (
      (payload.status === "CONFIRMED" || payload.status === "COMPLETED") &&
      order.type === "PURCHASE" &&
      user.role !== "admin"
    ) {
      throw new Error("FORBIDDEN");
    }

    const now = new Date();
    const fields: Partial<{
      reservedAt: Date | null;
      confirmedAt: Date | null;
      completedAt: Date | null;
      cancelledAt: Date | null;
      updatedAt: Date;
    }> = { updatedAt: now };

    if (payload.status === "RESERVED") {
      fields.reservedAt = now;
    } else if (payload.status === "CONFIRMED") {
      fields.confirmedAt = now;
    } else if (payload.status === "COMPLETED") {
      fields.completedAt = now;
    } else if (payload.status === "CANCELLED") {
      fields.cancelledAt = now;
    }

    const updated = await orderRepository.updateOrderStatus(orderId, payload.status, fields);

    if (updated) {
      if (payload.status === "CONFIRMED") {
        await publishOrderEvent("order.confirmed", updated);
      } else if (payload.status === "CANCELLED" && order.status === "RESERVED") {
        await publishOrderEvent("order.reservation.released", updated);
      }
    }

    return updated;
  },

  async cancelOrder(orderId: string, user: AuthUser, reason?: string) {
    if (!canAccess(user.role)) {
      throw new Error("FORBIDDEN");
    }

    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      throw new Error("NOT_FOUND");
    }

    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      throw new Error("CONFLICT");
    }

    if (user.role !== "admin" && order.createdBy !== user.sub) {
      throw new Error("FORBIDDEN");
    }

    const now = new Date();
    const updated = await orderRepository.updateOrderStatus(orderId, "CANCELLED", {
      cancelledAt: now,
      updatedAt: now,
    });

    if (updated && order.status === "RESERVED") {
      await publishOrderEvent("order.reservation.released", updated);
    }

    return updated;
  },

  async createOrder(payload: CreateOrderInput, user: AuthUser) {
    const { type, items = [], supplierRef, notes } = payload;

    if (!type || !isOrderType(type)) {
      throw new Error("INVALID_REQUEST");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("INVALID_REQUEST");
    }

    if (type === "PURCHASE" && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }

    if (type === "SALE" && user.role !== "admin" && user.role !== "vendedor") {
      throw new Error("FORBIDDEN");
    }

    const normalizedItems = items.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: Number(item.quantity),
    }));

    for (const item of normalizedItems) {
      if (!item.productVariantId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("INVALID_REQUEST");
      }
    }

    if (notes && notes.length > 2000) {
      throw new Error("INVALID_REQUEST");
    }

    const orderId = randomUUID();
    const now = new Date();
    const createdBy = user.sub;

    const order = {
      id: orderId,
      type,
      status: "DRAFT",
      supplierRef: supplierRef || null,
      notes: notes || null,
      createdBy,
      createdAt: now,
      updatedAt: now,
      reservedAt: null,
      confirmedAt: null,
      completedAt: null,
      cancelledAt: null,
    };

    await orderRepository.createOrder(order, normalizedItems);

    const created = await orderRepository.getOrderById(orderId);
    if (!created) {
      throw new Error("UNPROCESSABLE_ENTITY");
    }

    return created;
  },
};
