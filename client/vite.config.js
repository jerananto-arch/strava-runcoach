import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "RunCoach",
        short_name: "RunCoach",
        description: "Personal running coach — Sub-1:45 HM tracker",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/icon-72.png",  sizes: "72x72",  type: "image/png" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [{
          urlPattern: /^\/api\//,
          handler: "NetworkFirst",
          options: { cacheName: "api-cache", networkTimeoutSeconds: 10 },
        }],
      },
    }),
  ],
  server: {
    proxy: { "/api": "http://localhost:3001" },
  },
});
