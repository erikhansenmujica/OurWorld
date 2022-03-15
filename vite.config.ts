/// <reference types="vite/client" />
import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import cesium from "vite-plugin-cesium";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRefresh(),
    cesium(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
      ],
      devOptions: {
        enabled: true,
        /* other options */
      },
      workbox: {
        sourcemap: true,
      },
      manifest: {
        name: "Our World",
        short_name: "OW",
        description: "Making the world better",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
      web3: path.resolve(__dirname, "./node_modules/web3/dist/web3.min.js"),
    },
  },
});
