import { query } from "../config/database";

const createOrdersTableSql = `
  CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    type VARCHAR(8) NOT NULL CHECK (type IN ('PURCHASE', 'SALE')),
    status VARCHAR(12) NOT NULL CHECK (status IN ('DRAFT', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    supplier_ref VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    reserved_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
`;

const createOrderItemsTableSql = `
  CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
`;

export const initializeDatabase = async () => {
  await query(createOrdersTableSql);
  await query(createOrderItemsTableSql);
};
