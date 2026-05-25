import { defineConfig } from "tsup";
import { copyFileSync } from "fs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  // CSS is a standalone file — consumers import "@fvargas/cms-agent-panel/styles.css"
  injectStyle: false,
  onSuccess: async () => {
    // Copy styles.css to dist after build
    copyFileSync("src/styles.css", "dist/styles.css");
    console.log("Copied styles.css to dist/");
  },
});
