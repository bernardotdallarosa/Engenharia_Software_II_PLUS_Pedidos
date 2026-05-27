import { Router, type Request, type Response } from "express";

export const ordersRouter = Router();

const NOT_IMPLEMENTED = {
  error: "not_implemented",
  details: [
    "Contrato OpenAPI publicado; lógica de domínio em desenvolvimento.",
  ],
};

ordersRouter.post("/", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.get("/", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.get("/:orderId", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.patch("/:orderId/status", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

ordersRouter.post("/:orderId/cancel", (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});
