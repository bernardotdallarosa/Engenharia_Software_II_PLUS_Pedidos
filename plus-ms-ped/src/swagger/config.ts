import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const specPath = path.join(process.cwd(), "openapi", "openapi.yaml");

export const swaggerSpec = parse(readFileSync(specPath, "utf8")) as Record<
  string,
  unknown
>;
