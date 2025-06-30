// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }    
});