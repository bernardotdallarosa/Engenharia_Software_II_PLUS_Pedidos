import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { healthRouter } from "./routes/health";
import { ordersRouter } from "./routes/orders";
import { swaggerSpec } from "./swagger/config";

export const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4007",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4007",
    ],
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.redirect("/docs");
});

app.get("/openapi.yaml", (_req, res) => {
  res.sendFile("openapi.yaml", { root: `${process.cwd()}/openapi` });
});

app.use("/docs", ...swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/health", healthRouter);
app.use("/orders", ordersRouter);
