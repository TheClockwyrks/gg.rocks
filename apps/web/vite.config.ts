import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { ggDocs } from "./plugins/ggDocs/plugin.ts";

export default defineConfig({
  plugins: [
    react(),
    // The docs section: gg's documentation pages at the version
    // gg-docs.json pins, or the ones under GG_DOCS_DIR.
    ggDocs({
      repoRoot: fileURLToPath(new URL("../..", import.meta.url)),
      pinFile: fileURLToPath(new URL("./gg-docs.json", import.meta.url)),
      override: process.env.GG_DOCS_DIR,
    }),
  ],
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
