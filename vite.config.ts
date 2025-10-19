import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure Vite only serves from this workspace root
  server: {
    fs: { strict: true },
  },
  // Do not inherit another public dir from nested CRA app
  publicDir: "public",
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
    outDir: "dist",
  },
  optimizeDeps: {
    entries: ["index.html", "src/main.tsx"],
    exclude: [],
  },
  ssr: {
    noExternal: [],
  },
}));
