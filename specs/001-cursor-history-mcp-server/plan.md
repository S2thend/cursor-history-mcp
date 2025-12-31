# Implementation Plan: Cursor History MCP Server

**Branch**: `001-cursor-history-mcp-server` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cursor-history-mcp-server/spec.md`

## Summary

Create an MCP (Model Context Protocol) server that wraps the `cursor-history` npm package, exposing
Cursor AI chat history browsing, searching, exporting, backup, and migration capabilities to MCP
clients like Claude Code. The server follows a thin-wrapper architecture, translating MCP tool
calls to cursor-history library functions. Distributed via npm with npx support for zero-install
usage.

## Technical Context

**Language/Version**: TypeScript 5.0+ with Node.js 20+
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `cursor-history@0.8.0`
**Storage**: N/A (reads from Cursor's existing SQLite database via cursor-history library)
**Testing**: Vitest (unit tests), manual MCP client testing (integration)
**Target Platform**: macOS, Windows, Linux (cross-platform Node.js)
**Project Type**: Single project (npm package with CLI entry point)
**Performance Goals**: <1s server startup, <2s list operations, <3s view operations, <5s search
**Constraints**: Must work via npx without global install; stdio transport only for MVP
**Scale/Scope**: Single-user local tool; no concurrent access concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. MCP Protocol Compliance | Implement MCP spec exactly; JSON Schema for all tools | ✅ Planned |
| II. Thin Wrapper Architecture | Delegate to cursor-history; no custom business logic | ✅ Planned |
| III. Zero Configuration Default | Auto-detect Cursor paths per platform | ✅ Planned |
| IV. npx-First Distribution | npm publish with `bin` entry; bundle dependencies | ✅ Planned |
| V. Structured Error Handling | Return MCP error responses; no crashes | ✅ Planned |
| VI. TypeScript Strict Mode | `strict: true`; no `any` types | ✅ Planned |
| VII. Destructive Operation Safety | Backup warnings on migrate/restore/delete tools | ✅ Planned |

**Gate Result**: PASS - All principles addressed in design.

## Project Structure

### Documentation (this feature)

```text
specs/001-cursor-history-mcp-server/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (MCP tool schemas)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── index.ts             # MCP server entry point
├── tools/               # MCP tool handlers
│   ├── list-sessions.ts
│   ├── show-session.ts
│   ├── search.ts
│   ├── export.ts
│   ├── backup.ts
│   ├── restore.ts
│   └── migrate.ts
├── errors.ts            # Structured error handling
└── types.ts             # TypeScript type definitions

tests/
├── unit/                # Unit tests for tool handlers
└── integration/         # MCP protocol integration tests

package.json             # npm package with bin entry
tsconfig.json            # TypeScript strict config
```

**Structure Decision**: Single project structure. The MCP server is a standalone npm package with
a single entry point (`src/index.ts`) that registers tool handlers. Each tool maps directly to a
cursor-history library function.

## Complexity Tracking

No violations requiring justification. The design follows all constitution principles without
needing complexity exceptions.
