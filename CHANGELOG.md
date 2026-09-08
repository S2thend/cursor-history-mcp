# Changelog

## 0.3.0

- Upgrade the pinned `cursor-history` reader from 0.9.1 to 0.18.0, adding its Composer, Agent transcript, Store and ACP discovery/read support to MCP.
- Add exact native session UUID selectors and explicit workspace scope to reads and exports; retain one-based MCP indices with scoped semantics.
- Fix migration index conversion: the 0.18 migration API takes one-based indices, unlike the zero-based read API. Add UUID migration, source workspace and dry-run options.
- Preserve typed integrity/capability failures, source resolution state and timestamp provenance in tool responses. Keep complementary cross-workspace sources opt-in.
- Return JSON exports without double encoding; expose search match coordinates and neighboring lines.
- Reuse the hydrated sessions returned by the reader for year-pack generation instead of rescanning the catalog for every session. Resolve sparse rows by UUID within their selected workspace, never by an unscoped positional index.
- Honor `maxSamples: 0` in year-pack output; the sample selector previously returned its first eligible question even when samples were disabled.
- Keep `cursor-history` external in the build so package-relative files and native SQLite drivers resolve correctly. Report the MCP package version at initialization and align Node.js engine requirements with the reader.
- Add adapter regression tests and real stdio tests using synthetic Composer, Store, ACP and transcript databases. Tests build the server first.
- Refresh English, Chinese, French and Spanish READMEs, add the MCP companion banner, and link the CLI/library project.
- Publish npm packages through GitHub OIDC Trusted Publishing with Node.js 24 and npm >=11.5.1, alongside the existing MCP Registry OIDC flow.

Backup/restore remain Composer-only. Store-only, merged-source and ambiguous session migration remain unsupported; broader coverage is tracked in the core project's roadmap.

The MCP package version is 0.3.0; its reader remains pinned to the independently published `cursor-history@0.18.0`. See [Publishing](docs/publishing.md) for the OIDC setup and release checklist.
