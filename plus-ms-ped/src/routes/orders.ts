import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth";
import { orderService } from "../services/orderService";

export const ordersRouter = Router();

const NOT_IMPLEMENTED = {
  error: "not_implemented",
  details: [
    "Contrato OpenAPI publicado; lógica de domínio em desenvolvimento.",
  ],
};

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

ordersRouter.get("/", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.get("/:orderId", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.post("/:orderId/reserve", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.patch("/:orderId/status", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.post("/:orderId/cancel", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});
