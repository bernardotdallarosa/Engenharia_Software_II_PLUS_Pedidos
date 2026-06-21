import { randomUUID } from "crypto";
import { orderRepository } from "../repositories/orderRepository";

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

export const orderService = {
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

    return {
      id: order.id,
      type: order.type,
      status: order.status,
      items: normalizedItems.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      })),
      supplierRef: order.supplierRef,
      notes: order.notes,
      createdBy: order.createdBy,
      reservedAt: order.reservedAt,
      confirmedAt: order.confirmedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  },
};
