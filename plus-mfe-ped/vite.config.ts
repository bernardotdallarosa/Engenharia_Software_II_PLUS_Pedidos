import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mfe_ped",
      filename: "remoteEntry.js",
      exposes: {
        "./OrdersPage": "./src/pages/OrdersPage.tsx",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    target: "esnext",
    minify: false,
  },
  server: {
    port: 4007,
    host: true,
    origin: "http://localhost:4007",
    cors: true,
  },
  preview: {
    port: 4007,
    host: true,
  },
});
