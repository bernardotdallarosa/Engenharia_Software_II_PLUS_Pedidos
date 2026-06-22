import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const resolveQueueUrl = (queueUrl: string): string => {
  const endpoint = process.env.AWS_ENDPOINT;
  if (!endpoint || !queueUrl.includes("localhost")) {
    return queueUrl;
  }

  try {
    const endpointHost = new URL(endpoint).host;
    return queueUrl.replace(/localhost:\d+/, endpointHost);
  } catch {
    return queueUrl;
  }
};

const createSqsClient = () =>
  new SQSClient({
    region: process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
    ...(process.env.AWS_ENDPOINT
      ? {
          endpoint: process.env.AWS_ENDPOINT,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
          },
        }
      : {}),
  });

const logPublishError = (eventName: string, error: unknown) => {
  console.error(`[order-event-publisher] Failed to publish ${eventName}`, error);
};

export const publishOrderEvent = async (
  eventName: string,
  order: {
    id: string;
    type: string;
    status: string;
    items: Array<{ id?: string; productVariantId: string; quantity: number }>;
    supplierRef: string | null;
    notes: string | null;
    createdBy: string;
    reservedAt: Date | null;
    confirmedAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
) => {
  const queueUrl = process.env.ORDER_EVENTS_QUEUE_URL;

  if (!queueUrl) {
    console.warn("[order-event-publisher] ORDER_EVENTS_QUEUE_URL is not configured");
    return;
  }

  try {
    await createSqsClient().send(
      new SendMessageCommand({
        QueueUrl: resolveQueueUrl(queueUrl),
        MessageBody: JSON.stringify({
          eventName,
          occurredAt: new Date().toISOString(),
          data: {
            id: order.id,
            type: order.type,
            status: order.status,
            items: order.items,
            supplierRef: order.supplierRef,
            notes: order.notes,
            createdBy: order.createdBy,
            reservedAt: order.reservedAt?.toISOString() ?? null,
            confirmedAt: order.confirmedAt?.toISOString() ?? null,
            completedAt: order.completedAt?.toISOString() ?? null,
            cancelledAt: order.cancelledAt?.toISOString() ?? null,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
          },
        }),
      })
    );
  } catch (error) {
    logPublishError(eventName, error);
  }
};
