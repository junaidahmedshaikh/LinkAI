import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@linkai/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@linkai/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
    },
  },
  // CRXJS dev server — service-worker-loader.js imports from this port
  server: {
    port: 5174,
    strictPort: true,
    hmr: { port: 5174 },
  },
});
