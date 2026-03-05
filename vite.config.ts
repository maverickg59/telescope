import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "dbml-viewer",
  plugins: [react()],
  build: {
    outDir: "../dbml-dist",
    emptyOutDir: true,
  },
});
