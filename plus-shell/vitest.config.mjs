import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/** Testes sem federation (evita resolver `mfe_auth` nos unit tests). */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
