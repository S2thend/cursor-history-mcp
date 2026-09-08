# MCP SDK interoperability

`cursor-history-mcp@0.3.1` uses `@modelcontextprotocol/sdk@1.30.0` and `zod@3.25.76`. Its history reader remains `cursor-history@0.18.0`.

SDK package versions and MCP wire-protocol revisions are different things. A client using SDK v2 does not require every server to use SDK v2.

| Client configuration | Compatibility with this stdio server |
| --- | --- |
| SDK v1.30.0 | Supported |
| SDK v2.0.0, default negotiation | Supported through the legacy `initialize` handshake |
| SDK v2.0.0, `versionNegotiation: { mode: "auto" }` | Supported through legacy fallback |
| SDK v2, pinned to `2026-07-28`, or excluding all legacy versions | Not supported; the client disallows fallback |

The integration suite exercises tool discovery, history listing/search, reading/exporting all four synthetic storage formats, workspace scoping, rejected Store migration, and Composer backup/restore through real stdio connections for the first three configurations. It also verifies rejection when a v2 client pins the modern-only protocol. The v2 client is a development-only dependency; it is not bundled into the server.

This does not certify every application's custom client settings. Automatic stdio negotiation may spawn an extra probe process and incur a timeout before fallback; default legacy negotiation avoids that overhead.

See the [official protocol-version guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/protocol-versions.md) for negotiation rules and the [v2 migration guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/upgrade-to-v2.md) for the separate server upgrade needed to support modern-only clients.
