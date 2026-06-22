export type OrderType = "SALE" | "PURCHASE";
export type OrderStatus =
  | "DRAFT"
  | "RESERVED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItem {
  id?: string;
  productVariantId: string;
  quantity: number;
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  supplierRef?: string | null;
  notes?: string | null;
  items: OrderItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reservedAt?: string | null;
  confirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface OrderListResponse {
  items: Order[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateOrderPayload {
  type: OrderType;
  supplierRef?: string;
  notes?: string;
  items: Array<{
    productVariantId: string;
    quantity: number;
  }>;
}
