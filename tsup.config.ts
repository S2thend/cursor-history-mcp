import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: true,
  banner: { js: "#!/usr/bin/env node" },
  // Preserve package-relative metadata, modules and SQLite native bindings.
  external: ["cursor-history"],
  noExternal: ["@modelcontextprotocol/sdk", "zod"],
});
