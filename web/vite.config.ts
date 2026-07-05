import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base is set at build time for GitHub Pages project sites, e.g. /philippines-flight-tracker/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
});
