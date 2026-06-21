import { randomUUID } from "crypto";
import { query } from "../config/database";

export const orderRepository = {
  async countOrders() {
    const result = await query("SELECT COUNT(*)::int AS total FROM orders");
    return result.rows[0]?.total ?? 0;
  },

  async createOrder(
    order: {
      id: string;
      type: string;
      status: string;
      supplierRef: string | null;
      notes: string | null;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
      reservedAt: Date | null;
      confirmedAt: Date | null;
      completedAt: Date | null;
      cancelledAt: Date | null;
    },
    items: Array<{ productVariantId: string; quantity: number }>
  ) {
    await query(
      `
        INSERT INTO orders (
          id,
          type,
          status,
          supplier_ref,
          notes,
          created_by,
          reserved_at,
          confirmed_at,
          completed_at,
          cancelled_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        order.id,
        order.type,
        order.status,
        order.supplierRef,
        order.notes,
        order.createdBy,
        order.reservedAt,
        order.confirmedAt,
        order.completedAt,
        order.cancelledAt,
        order.createdAt,
        order.updatedAt,
      ]
    );

    for (const item of items) {
      await query(
        `
          INSERT INTO order_items (
            id,
            order_id,
            product_variant_id,
            quantity,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          randomUUID(),
          order.id,
          item.productVariantId,
          item.quantity,
          order.createdAt,
          order.updatedAt,
        ]
      );
    }
  },
};
