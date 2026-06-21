import { app } from "./app";
import { initializeDatabase } from "./database/schema";

const PORT = Number(process.env.PORT) || 3007;
const HOST = process.env.LISTEN_HOST || "0.0.0.0";

const start = async () => {
  try {
    await initializeDatabase();
    console.log("Database schema initialized successfully");

    app.listen(PORT, HOST, () => {
      console.log(`plus-ms-ped a escutar em http://${HOST}:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/docs`);
      console.log(`OpenAPI YAML: http://localhost:${PORT}/openapi.yaml`);
    });
  } catch (error) {
    console.error("Failed to initialize database connection", error);
    process.exit(1);
  }
};

start();
