import { randomUUID } from "crypto";
import { query } from "../config/database";

type OrderRecord = {
  id: string;
  type: string;
  status: string;
  supplier_ref: string | null;
  notes: string | null;
  created_by: string;
  reserved_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRecord = {
  id: string;
  order_id: string;
  product_variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

const toDate = (value: string | null) => (value ? new Date(value) : null);

const mapOrder = (orderRow: OrderRecord, items: OrderItemRecord[]) => ({
  id: orderRow.id,
  type: orderRow.type,
  status: orderRow.status,
  items: items.map((item) => ({
    id: item.id,
    productVariantId: item.product_variant_id,
    quantity: item.quantity,
  })),
  supplierRef: orderRow.supplier_ref,
  notes: orderRow.notes,
  createdBy: orderRow.created_by,
  reservedAt: toDate(orderRow.reserved_at),
  confirmedAt: toDate(orderRow.confirmed_at),
  completedAt: toDate(orderRow.completed_at),
  cancelledAt: toDate(orderRow.cancelled_at),
  createdAt: new Date(orderRow.created_at),
  updatedAt: new Date(orderRow.updated_at),
});

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
      const itemId = randomUUID();
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
          itemId,
          order.id,
          item.productVariantId,
          item.quantity,
          order.createdAt,
          order.updatedAt,
        ]
      );
    }
  },

  async listOrders(queryParams: {
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    pageSize: number;
  }) {
    const page = Math.max(1, queryParams.page || 1);
    const pageSize = Math.max(1, Math.min(100, queryParams.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const whereClauses: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (queryParams.type) {
      whereClauses.push(`type = $${index}`);
      values.push(queryParams.type);
      index += 1;
    }

    if (queryParams.status) {
      whereClauses.push(`status = $${index}`);
      values.push(queryParams.status);
      index += 1;
    }

    if (queryParams.dateFrom) {
      whereClauses.push(`created_at >= $${index}`);
      values.push(queryParams.dateFrom);
      index += 1;
    }

    if (queryParams.dateTo) {
      whereClauses.push(`created_at <= $${index}`);
      values.push(queryParams.dateTo);
      index += 1;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM orders ${whereSql}`,
      values
    );
    const total = countResult.rows[0]?.total ?? 0;

    const ordersResult = await query(
      `
        SELECT
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
        FROM orders
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT $${index} OFFSET $${index + 1}
      `,
      [...values, pageSize, offset]
    );

    const orders = [] as Array<ReturnType<typeof mapOrder>>;
    for (const orderRow of ordersResult.rows as OrderRecord[]) {
      const itemsResult = await query(
        `
          SELECT
            id,
            order_id,
            product_variant_id,
            quantity,
            created_at,
            updated_at
          FROM order_items
          WHERE order_id = $1
          ORDER BY created_at ASC
        `,
        [orderRow.id]
      );
      orders.push(mapOrder(orderRow, itemsResult.rows as OrderItemRecord[]));
    }

    return {
      items: orders,
      page,
      pageSize,
      total,
    };
  },

  async getOrderById(orderId: string) {
    const result = await query(
      `
        SELECT
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
        FROM orders
        WHERE id = $1
      `,
      [orderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const orderRow = result.rows[0] as OrderRecord;
    const itemsResult = await query(
      `
        SELECT
          id,
          order_id,
          product_variant_id,
          quantity,
          created_at,
          updated_at
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `,
      [orderRow.id]
    );

    return mapOrder(orderRow, itemsResult.rows as OrderItemRecord[]);
  },

  async updateOrderStatus(orderId: string, status: string, fields: Partial<{
    reservedAt: Date | null;
    confirmedAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    updatedAt: Date;
  }>) {
    const now = fields.updatedAt ?? new Date();
    await query(
      `
        UPDATE orders
        SET
          status = $1,
          reserved_at = COALESCE($2, reserved_at),
          confirmed_at = COALESCE($3, confirmed_at),
          completed_at = COALESCE($4, completed_at),
          cancelled_at = COALESCE($5, cancelled_at),
          updated_at = $6
        WHERE id = $7
      `,
      [
        status,
        fields.reservedAt ?? null,
        fields.confirmedAt ?? null,
        fields.completedAt ?? null,
        fields.cancelledAt ?? null,
        now,
        orderId,
      ]
    );

    return this.getOrderById(orderId);
  },
};
