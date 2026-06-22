import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth";
import { orderService } from "../services/orderService";

export const ordersRouter = Router();

ordersRouter.use(authenticate);

ordersRouter.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub || !req.user.role) {
      res.status(401).json({ error: "unauthorized", details: ["Missing authenticated user"] });
      return;
    }

    const result = await orderService.createOrder(req.body, {
      sub: req.user.sub,
      user_id: req.user.user_id,
      role: req.user.role,
    });
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REQUEST") {
      res.status(400).json({ error: "bad_request", details: [error.message] });
      return;
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      res.status(403).json({ error: "forbidden", details: ["Role not allowed"] });
      return;
    }

    if (error instanceof Error && error.message === "UNPROCESSABLE_ENTITY") {
      res.status(422).json({ error: "unprocessable_entity", details: [error.message] });
      return;
    }

    res.status(500).json({ error: "internal_error", details: ["Unexpected error"] });
  }
});

ordersRouter.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub || !req.user.role) {
      res.status(401).json({ error: "unauthorized", details: ["Missing authenticated user"] });
      return;
    }

    const result = await orderService.listOrders(
      {
        type: typeof req.query.type === "string" ? req.query.type : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        dateFrom: typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined,
        dateTo: typeof req.query.dateTo === "string" ? req.query.dateTo : undefined,
        page: Number(req.query.page || 1),
        pageSize: Number(req.query.pageSize || 20),
      },
      {
        sub: req.user.sub,
        user_id: req.user.user_id,
        role: req.user.role,
      }
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      res.status(403).json({ error: "forbidden", details: ["Role not allowed"] });
      return;
    }

    res.status(500).json({ error: "internal_error", details: ["Unexpected error"] });
  }
});

ordersRouter.get("/:orderId", async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub || !req.user.role) {
      res.status(401).json({ error: "unauthorized", details: ["Missing authenticated user"] });
      return;
    }

    const result = await orderService.getOrderById(req.params.orderId, {
      sub: req.user.sub,
      user_id: req.user.user_id,
      role: req.user.role,
    });

    if (!result) {
      res.status(404).json({ error: "not_found", details: ["Order not found"] });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      res.status(403).json({ error: "forbidden", details: ["Role not allowed"] });
      return;
    }

    res.status(500).json({ error: "internal_error", details: ["Unexpected error"] });
  }
});

ordersRouter.post("/:orderId/reserve", async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub || !req.user.role) {
      res.status(401).json({ error: "unauthorized", details: ["Missing authenticated user"] });
      return;
    }

    const result = await orderService.reserveOrder(req.params.orderId, {
      sub: req.user.sub,
      user_id: req.user.user_id,
      role: req.user.role,
    });

    if (!result) {
      res.status(404).json({ error: "not_found", details: ["Order not found"] });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      res.status(403).json({ error: "forbidden", details: ["Role not allowed"] });
      return;
    }

    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "not_found", details: ["Order not found"] });
      return;
    }

    if (error instanceof Error && error.message === "CONFLICT") {
      res.status(409).json({ error: "conflict", details: ["Invalid order transition"] });
      return;
    }

    res.status(500).json({ error: "internal_error", details: ["Unexpected error"] });
  }
});

ordersRouter.patch("/:orderId/status", async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub || !req.user.role) {
      res.status(401).json({ error: "unauthorized", details: ["Missing authenticated user"] });
      return;
    }

    const result = await orderService.updateOrderStatus(
      req.params.orderId,
      req.body,
      {
        sub: req.user.sub,
        user_id: req.user.user_id,
        role: req.user.role,
      }
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REQUEST") {
      res.status(400).json({ error: "bad_request", details: [error.message] });
      return;
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      res.status(403).json({ error: "forbidden", details: ["Role not allowed"] });
      return;
    }

    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "not_found", details: ["Order not found"] });
      return;
    }

    if (error instanceof Error && error.message === "CONFLICT") {
      res.status(409).json({ error: "conflict", details: ["Invalid order transition"] });
      return;
    }

    res.status(500).json({ error: "internal_error", details: ["Unexpected error"] });
  }
});

ordersRouter.post("/:orderId/cancel", async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.sub || !req.user.role) {
      res.status(401).json({ error: "unauthorized", details: ["Missing authenticated user"] });
      return;
    }

    const result = await orderService.cancelOrder(
      req.params.orderId,
      {
        sub: req.user.sub,
        user_id: req.user.user_id,
        role: req.user.role,
      },
      req.body?.reason
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      res.status(403).json({ error: "forbidden", details: ["Role not allowed"] });
      return;
    }

    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "not_found", details: ["Order not found"] });
      return;
    }

    if (error instanceof Error && error.message === "CONFLICT") {
      res.status(409).json({ error: "conflict", details: ["Invalid order transition"] });
      return;
    }

    res.status(500).json({ error: "internal_error", details: ["Unexpected error"] });
  }
});
