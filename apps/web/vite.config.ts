import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Chart data pulled from The Test Cabinet, read at build time.
      "@run-data": fileURLToPath(new URL("../../run-data", import.meta.url)),
    },
  },
});
