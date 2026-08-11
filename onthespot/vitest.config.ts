import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/onthespot_test?schema=public",
    },
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "./tests/empty-module.ts"),
      "client-only": path.resolve(__dirname, "./tests/empty-module.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
