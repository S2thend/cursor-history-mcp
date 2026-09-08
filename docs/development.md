# Development toolchain

Use Node.js 24 for development and release validation, matching the publishing workflow. The published server's runtime Node.js support is unchanged; the test runner and its Vite dependency have their own, stricter development requirements.

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm audit
```

Vitest 4.1.11 fixes advisories that were not backported to the previous 2.x test runner. The existing test suite runs without application or test-logic changes. tsup is pinned to 8.5.1.

## Temporary build-only override

`package.json` overrides `tsup > esbuild` to 0.28.1. tsup 8.5.1 requests `^0.27.0`, which cannot select the patched release for [GHSA-g7r4-m6w7-qqqr](https://github.com/evanw/esbuild/security/advisories/GHSA-g7r4-m6w7-qqqr). The advisory concerns esbuild's development HTTP server on Windows; this project does not use that server.

This narrow override keeps the existing bundler and is checked with production builds, declaration generation, watch rebuilds and MCP integration tests. Remove it after upgrading to a tsup release whose declared esbuild range includes a patched version. Do not replace it with a blanket forced audit fix.

The watch smoke check uses `tsup --watch 'src/**/*.ts'` and verifies a rebuild after a source-file change. In environments with exhausted OS file watchers, run it with `CHOKIDAR_USEPOLLING=1`; this is an environment workaround, not a required project setting.
