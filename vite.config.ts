import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import cesium from "vite-plugin-cesium";
import replace from "@rollup/plugin-replace";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), cesium()],
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
    },
  },
});
