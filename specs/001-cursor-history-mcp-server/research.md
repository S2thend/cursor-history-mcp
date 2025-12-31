# Research: Cursor History MCP Server

**Date**: 2025-12-31
**Feature**: 001-cursor-history-mcp-server

## Technology Decisions

### 1. MCP SDK Version

**Decision**: Use `@modelcontextprotocol/server` v1.x (stable)

**Rationale**: The v2 SDK is in pre-alpha and not recommended for production until Q1 2026. The v1.x
branch will receive bug fixes and security updates for at least 6 months after v2 ships. For a new
MCP server that needs to work reliably with Claude Code, v1.x is the correct choice.

**Alternatives considered**:
- v2 (pre-alpha): Rejected due to instability and lack of production readiness
- Direct protocol implementation: Rejected due to complexity and maintenance burden

### 2. Transport Layer

**Decision**: stdio transport only (MVP)

**Rationale**: Claude Code and most MCP clients use stdio transport. The MCP SDK provides built-in
stdio support. HTTP/SSE transport adds complexity without clear user benefit for a local tool.

**Alternatives considered**:
- HTTP/SSE transport: Deferred to future version if remote access needed
- Both transports: Adds configuration complexity; violates zero-config principle

### 3. cursor-history Integration

**Decision**: Use cursor-history library API directly (not CLI subprocess)

**Rationale**: The cursor-history package exports a full library API including `listSessions`,
`getSession`, `searchSessions`, `exportSessionToMarkdown`, `exportSessionToJson`, `createBackup`,
`restoreBackup`, `migrateSession`, and `migrateWorkspace`. Direct library calls are faster, more
reliable, and provide typed responses.

**Alternatives considered**:
- CLI subprocess: Slower, requires parsing text output, error handling more complex
- Direct SQLite access: Violates thin-wrapper principle; duplicates cursor-history logic

### 4. Error Handling Strategy

**Decision**: Map cursor-history errors to MCP error codes using type guards

**Rationale**: cursor-history provides type guard functions (`isDatabaseLockedError`,
`isDatabaseNotFoundError`, `isSessionNotFoundError`, `isWorkspaceNotFoundError`, `isBackupError`,
`isRestoreError`, `isInvalidBackupError`) that allow precise error classification. These can be
mapped to appropriate MCP error codes.

**Error code mapping**:
| cursor-history Error | MCP Error Code | Description |
|---------------------|----------------|-------------|
| DatabaseNotFoundError | -32001 | Cursor not installed or no history |
| DatabaseLockedError | -32002 | Database in use (Cursor running) |
| SessionNotFoundError | -32003 | Invalid session index |
| WorkspaceNotFoundError | -32004 | Workspace path not found |
| BackupError | -32005 | Backup operation failed |
| RestoreError | -32006 | Restore operation failed |
| InvalidBackupError | -32007 | Backup file corrupted |

### 5. Package Bundling Strategy

**Decision**: Bundle all dependencies using esbuild or tsup for npx compatibility

**Rationale**: npx downloads and runs packages directly. Native dependencies (better-sqlite3 in
cursor-history) require platform-specific binaries. Using `@anthropic-ai/sdk` pattern of bundling
ensures the package works immediately without post-install scripts.

**Alternatives considered**:
- Standard npm dependencies: Rejected; native modules may fail during npx install
- Webpack: More complex configuration than esbuild/tsup

### 6. Testing Strategy

**Decision**: Vitest for unit tests; manual MCP client testing for integration

**Rationale**: Vitest is fast, TypeScript-native, and works well with ES modules. Integration
testing MCP servers requires a real MCP client (Claude Code) which cannot be automated in CI.
Unit tests can mock the cursor-history library to test tool handler logic.

**Alternatives considered**:
- Jest: Slower, requires more configuration for ESM
- Automated MCP integration tests: No standard test harness exists

## API Mapping

### cursor-history Library to MCP Tools

| Library Function | MCP Tool | Parameters |
|-----------------|----------|------------|
| `listSessions(config)` | `cursor_history_list` | limit?, workspace?, offset? |
| `getSession(index, config)` | `cursor_history_show` | sessionIndex |
| `searchSessions(query, config)` | `cursor_history_search` | query, limit?, context? |
| `exportSessionToMarkdown(index)` | `cursor_history_export` | sessionIndex, format="markdown" |
| `exportSessionToJson(index)` | `cursor_history_export` | sessionIndex, format="json" |
| `createBackup(config)` | `cursor_history_backup` | outputPath?, force? |
| `restoreBackup(config)` | `cursor_history_restore` | backupPath, force? |
| `migrateSession(config)` | `cursor_history_migrate` | sessions, destination, mode? |

### Tool Naming Convention

**Decision**: Use `cursor_history_` prefix for all tools

**Rationale**: MCP tool names must be unique across all servers. Using a clear prefix prevents
collisions with other MCP servers and makes tools discoverable when listing available tools.

## Dependencies (Exact Versions)

```json
{
  "dependencies": {
    "@modelcontextprotocol/server": "1.0.0",
    "cursor-history": "0.8.0",
    "zod": "3.25.0"
  },
  "devDependencies": {
    "typescript": "5.7.0",
    "tsup": "8.0.0",
    "vitest": "2.0.0",
    "@types/node": "20.0.0"
  }
}
```

Note: Exact versions per constitution principle on dependency management. Zod is a required peer
dependency of the MCP SDK.

## Open Questions (None)

All technical decisions have been resolved. No NEEDS CLARIFICATION items remain.
