import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Must come before react() — generates src/routeTree.gen.ts from src/routes/
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  // Vite 8+ resolves tsconfig paths natively (replaces vite-tsconfig-paths plugin)
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
  },
});
