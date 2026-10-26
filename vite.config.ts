import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const icons = [
  { src: "pwa.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
  { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
  { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
  { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "apple-touch-icon-180x180.png", "pwa.svg"],
      manifest: {
        id: "/",
        name: "LivSafe Client",
        short_name: "LivSafe Client",
        description: "Home safety assessment — photos, a written report, no visit required.",
        theme_color: "#1A73E8",
        background_color: "#F9FAFB",
        display: "standalone",
        orientation: "any",
        lang: "en",
        start_url: "/",
        scope: "/",
        categories: ["health", "lifestyle"],
        icons,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
        suppressWarnings: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    headers: {
      "Permissions-Policy": "geolocation=(), microphone=(self), camera=()",
    },
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
