import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";

// Plugin to preserve node: protocol in dynamic imports
const preserveNodeProtocol: Plugin = {
  name: "preserve-node-protocol",
  setup(build) {
    // Intercept the output and fix the stripped node: prefix
    build.onEnd((result) => {
      if (result.outputFiles) {
        for (const file of result.outputFiles) {
          if (file.path.endsWith(".cjs") || file.path.endsWith(".js")) {
            // Replace import("sqlite") with import("node:sqlite")
            file.contents = new TextEncoder().encode(
              new TextDecoder().decode(file.contents)
                .replace(/import\("sqlite"\)/g, 'import("node:sqlite")')
            );
          }
        }
      }
    });
  },
};

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: true,
  splitting: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Bundle all dependencies for npx compatibility
  noExternal: [/.*/],
  esbuildPlugins: [preserveNodeProtocol],
});
