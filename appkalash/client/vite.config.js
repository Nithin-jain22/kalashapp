import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Ensure public assets are properly copied
    assetsDir: "assets",
  },
  // Ensure service worker and manifest are served correctly
  optimizeDeps: {
    exclude: ["service-worker.js"],
  },
});
