import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { publishOrderEvent, resolveQueueUrl } from "../src/services/orderEventPublisher";
import { SQSClient } from "@aws-sdk/client-sqs";

describe("publishOrderEvent", () => {
  const sendSpy = vi.spyOn(SQSClient.prototype, "send");

  beforeEach(() => {
    sendSpy.mockReset();
    process.env.ORDER_EVENTS_QUEUE_URL = "https://queue.example.com/test";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envia o evento para a fila quando configurada", async () => {
    sendSpy.mockResolvedValue({} as never);

    await publishOrderEvent("order.reserved", {
      id: "order-1",
      type: "SALE",
      status: "RESERVED",
      items: [{ id: "item-1", productVariantId: "variant-1", quantity: 1 }],
      supplierRef: null,
      notes: null,
      createdBy: "vendedor@example.com",
      reservedAt: new Date("2026-01-02T00:00:00.000Z"),
      confirmedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it("não falha quando a fila não está configurada", async () => {
    delete process.env.ORDER_EVENTS_QUEUE_URL;

    await expect(
      publishOrderEvent("order.confirmed", {
        id: "order-2",
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
      })
    ).resolves.not.toThrow();

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("não falha quando SQS lança erro", async () => {
    sendSpy.mockRejectedValue(new Error("boom"));

    await expect(
      publishOrderEvent("order.reservation.released", {
        id: "order-3",
        type: "SALE",
        status: "CANCELLED",
        items: [],
        supplierRef: null,
        notes: null,
        createdBy: "vendedor@example.com",
        reservedAt: new Date(),
        confirmedAt: null,
        completedAt: null,
        cancelledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).resolves.not.toThrow();
  });

  it("reescreve localhost na queue URL quando AWS_ENDPOINT aponta para ministack", () => {
    process.env.AWS_ENDPOINT = "http://ministack:4566";

    expect(
      resolveQueueUrl("http://localhost:4566/000000000000/plus-order-events")
    ).toBe("http://ministack:4566/000000000000/plus-order-events");
  });
});
