import type { CreateOrderPayload, Order, OrderListResponse } from "./types";
import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_MS_PED_URL || "http://localhost:3007";

function buildHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatApiError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const body = data as { error?: string; details?: string[] };
    if (body.details?.length) {
      return body.details.join("; ");
    }
    if (body.error) {
      return body.error;
    }
  }
  return `HTTP ${status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      throw new Error("Resposta inválida do servidor");
    }
  }

  if (!response.ok) {
    throw new Error(formatApiError(data, response.status));
  }

  return data as T;
}

export async function fetchOrders(filters?: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<OrderListResponse> {
  const params = new URLSearchParams();

  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));

  return request<OrderListResponse>(`/orders${params.toString() ? `?${params}` : ""}`);
}

export async function fetchOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}`);
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reserveOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/reserve`, {
    method: "POST",
  });
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  return request<Order>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function cancelOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/cancel`, {
    method: "POST",
  });
}
