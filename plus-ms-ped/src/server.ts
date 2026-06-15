import { app } from "./app";

const PORT = Number(process.env.PORT) || 3007;
const HOST = process.env.LISTEN_HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`plus-ms-ped a escutar em http://${HOST}:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`OpenAPI YAML: http://localhost:${PORT}/openapi.yaml`);
});
