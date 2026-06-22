import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { cancelOrder, createOrder, fetchOrder, fetchOrders, reserveOrder, updateOrderStatus } from "../api";
import { getUserRole } from "../auth";
import type { Order, OrderStatus, OrderType } from "../types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Rascunho",
  RESERVED: "Reservado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const ORDER_TYPES: OrderType[] = ["SALE", "PURCHASE"];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [newOrder, setNewOrder] = useState({
    type: "SALE" as OrderType,
    supplierRef: "",
    notes: "",
    items: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const userRole = getUserRole();
  const isAdmin = userRole === "admin";
  const creatableTypes: OrderType[] = isAdmin ? ORDER_TYPES : ["SALE"];

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchOrders({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      setOrders(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }

    let active = true;
    const loadSelected = async () => {
      try {
        const order = await fetchOrder(selectedOrderId);
        if (active) setSelectedOrder(order);
      } catch {
        if (active) setSelectedOrder(null);
      }
    };

    loadSelected();
    return () => {
      active = false;
    };
  }, [selectedOrderId]);

  const selected = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || selectedOrder,
    [orders, selectedOrderId, selectedOrder]
  );

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
  };

  const handleCreateOrder = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const items = newOrder.items
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [productVariantId, quantity] = line.split(",").map((part) => part.trim());
          return {
            productVariantId,
            quantity: Number(quantity || 1),
          };
        })
        .filter((item) => item.productVariantId && Number.isFinite(item.quantity) && item.quantity > 0);

      if (!items.length) {
        throw new Error("Informe pelo menos um item no formato productVariantId, quantidade");
      }

      const created = await createOrder({
        type: newOrder.type,
        supplierRef: newOrder.supplierRef || undefined,
        notes: newOrder.notes || undefined,
        items,
      });
      setSelectedOrderId(created.id);
      setNewOrder({
        type: "SALE",
        supplierRef: "",
        notes: "",
        items: "",
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (action: "reserve" | "confirm" | "complete" | "cancel") => {
    if (!selected) return;
    try {
      setError(null);
      if (action === "reserve") {
        const updated = await reserveOrder(selected.id);
        setSelectedOrder(updated);
      } else if (action === "confirm") {
        const updated = await updateOrderStatus(selected.id, "CONFIRMED");
        setSelectedOrder(updated);
      } else if (action === "complete") {
        const updated = await updateOrderStatus(selected.id, "COMPLETED");
        setSelectedOrder(updated);
      } else {
        const updated = await cancelOrder(selected.id);
        setSelectedOrder(updated);
      }
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao executar ação");
    }
  };

  const canReserve = selected?.status === "DRAFT";
  const canConfirm = selected?.status === "DRAFT" || selected?.status === "RESERVED";
  const canComplete =
    selected?.status === "CONFIRMED" &&
    (isAdmin || selected.type === "SALE");
  const canCancel = selected?.status !== "COMPLETED" && selected?.status !== "CANCELLED";

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Pedidos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={typeFilter}
            label="Tipo"
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {ORDER_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.keys(STATUS_LABELS).map((status) => (
              <MenuItem key={status} value={status}>
                {STATUS_LABELS[status as OrderStatus]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        <Paper sx={{ p: 2, flex: 1.3 }}>
          <Typography variant="h6">Novo pedido</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={newOrder.type}
                label="Tipo"
                onChange={(event) =>
                  setNewOrder((prev) => ({ ...prev, type: event.target.value as OrderType }))
                }
              >
                {creatableTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Fornecedor / referência"
              value={newOrder.supplierRef}
              onChange={(event) =>
                setNewOrder((prev) => ({ ...prev, supplierRef: event.target.value }))
              }
            />
            <TextField
              size="small"
              label="Observações"
              value={newOrder.notes}
              onChange={(event) =>
                setNewOrder((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
            <TextField
              multiline
              minRows={4}
              label="Itens (productVariantId, quantidade)"
              placeholder="var-1,2\nvar-2,1"
              value={newOrder.items}
              onChange={(event) => setNewOrder((prev) => ({ ...prev, items: event.target.value }))}
            />
            <Button variant="contained" onClick={handleCreateOrder} disabled={submitting}>
              {submitting ? "Criando..." : "Criar pedido"}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, flex: 2 }}>
          <Typography variant="h6">Pedidos</Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {orders.map((order) => (
                <Box
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 1,
                    cursor: "pointer",
                    backgroundColor: selected?.id === order.id ? "#f7f7f7" : "white",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">{order.id}</Typography>
                    <Chip label={STATUS_LABELS[order.status]} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {order.type} · {order.items.length} item(ns)
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 2, flex: 2 }}>
          {selected ? (
            <>
              <Typography variant="h6">Detalhes do pedido</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Criado por {selected.createdBy}
              </Typography>
              <Typography variant="body2">Status: {STATUS_LABELS[selected.status]}</Typography>
              <Typography variant="body2">Tipo: {selected.type}</Typography>
              <Typography variant="body2">Fornecedor: {selected.supplierRef || "—"}</Typography>
              <Typography variant="body2">Observações: {selected.notes || "—"}</Typography>
              <Typography variant="body2">Criado em: {formatDate(selected.createdAt)}</Typography>
              <Typography variant="body2">Atualizado em: {formatDate(selected.updatedAt)}</Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Itens</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {selected.items.map((item, index) => (
                    <Box key={`${selected.id}-${index}`} sx={{ borderBottom: "1px solid #eee", pb: 1 }}>
                      <Typography variant="body2">{item.productVariantId}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantidade: {item.quantity}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button variant="outlined" disabled={!canReserve} onClick={() => handleAction("reserve")}>
                  Reservar
                </Button>
                <Button variant="outlined" disabled={!canConfirm} onClick={() => handleAction("confirm")}>
                  Confirmar
                </Button>
                <Button variant="outlined" disabled={!canComplete} onClick={() => handleAction("complete")}>
                  Concluir
                </Button>
                <Button variant="outlined" color="error" disabled={!canCancel} onClick={() => handleAction("cancel")}>
                  Cancelar
                </Button>
              </Stack>
            </>
          ) : (
            <Typography color="text.secondary">Selecione um pedido para visualizar detalhes.</Typography>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
