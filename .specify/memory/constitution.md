<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A (initial)
Added sections:
  - Core Principles (7 principles)
  - MCP Protocol Compliance
  - Development Workflow
  - Governance
Removed sections: N/A (initial)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (already generic)
  - .specify/templates/spec-template.md ✅ (already generic)
  - .specify/templates/tasks-template.md ✅ (already generic)
Follow-up TODOs: None
-->

# cursor-history-mcp Constitution

## Core Principles

### I. MCP Protocol Compliance

This server MUST implement the Model Context Protocol (MCP) specification exactly. All tool
definitions, resource endpoints, and message formats MUST conform to the official MCP schema.
Non-compliant implementations break interoperability with MCP clients (Claude Code, etc.).

**Rationale**: MCP is a standardized protocol; deviations cause silent failures or undefined
behavior in client applications.

### II. Thin Wrapper Architecture

This server MUST act as a thin wrapper around the `cursor-history` npm package. Business logic
belongs in the upstream library; this server translates MCP requests to library calls and library
responses to MCP responses. No data transformation logic beyond protocol translation is permitted.

**Rationale**: Keeps maintenance burden low, ensures upstream improvements automatically benefit
this server, and avoids duplicating logic that already exists.

### III. Zero Configuration Default

The server MUST work out-of-the-box with zero mandatory configuration. Default paths and settings
MUST follow platform conventions (XDG on Linux, Application Support on macOS, AppData on Windows).
Optional configuration MAY override defaults but MUST NOT be required for basic operation.

**Rationale**: MCP servers are often installed via package managers; users expect immediate
functionality without manual setup.

### IV. npx-First Distribution

The server MUST be published to npm with a `bin` entry enabling `npx cursor-history-mcp` execution.
The package MUST bundle all dependencies (no peer dependencies for runtime). The binary MUST be
self-contained and start the MCP server on stdio without requiring global installation.

**Rationale**: `npx` execution allows users to add the server to MCP client configurations without
permanent installation. This is the standard distribution pattern for MCP servers.

### V. Structured Error Handling

All errors MUST be returned as structured MCP error responses with:
- Appropriate MCP error code
- Human-readable message
- Optional diagnostic data for debugging

Exceptions MUST NOT propagate to the transport layer. Crashes are unacceptable.

**Rationale**: MCP clients depend on structured errors for graceful degradation and user feedback.

### VI. TypeScript Strict Mode

All source code MUST be written in TypeScript with `strict: true` compiler options. Any type
must be avoided; explicit types are preferred. Third-party libraries without type definitions
MUST have local type declarations added.

**Rationale**: Type safety catches integration errors at compile time, critical for a protocol
bridge where type mismatches cause runtime failures.

### VII. Destructive Operation Safety

Tools that perform write operations (migrate, recover, delete, etc.) MUST include a backup
suggestion in their tool description. The description MUST explicitly warn users that the
operation modifies data and recommend creating a backup first. Example format:

> "⚠️ This operation modifies your Cursor history database. Consider backing up your database
> first using the backup tool."

The server MAY provide a dedicated backup tool to facilitate this workflow.

**Rationale**: Cursor history data is irreplaceable user data. Users MUST be informed before
any destructive operation to prevent accidental data loss.

## MCP Protocol Compliance

This section details specific protocol requirements:

- **Transport**: MUST support stdio transport (primary). MAY support HTTP/SSE transport.
- **Capabilities**: Server MUST declare capabilities accurately in `initialize` response.
- **Tools**: Each tool MUST have a JSON Schema for its input parameters.
- **Resources**: If exposing resources, MUST implement list and read operations.
- **Logging**: MAY use MCP logging levels (debug, info, warning, error) via notifications.

## Development Workflow

### Code Quality Gates

- All PRs MUST pass TypeScript compilation with zero errors
- All PRs MUST pass ESLint with zero warnings (warn-to-error in CI)
- All PRs MUST include or update tests for changed functionality
- Manual testing against an MCP client (e.g., Claude Code) is REQUIRED before merge

### Dependency Management

- `cursor-history` version MUST be pinned to exact version (no caret/tilde)
- MCP SDK (`@modelcontextprotocol/sdk`) version MUST be pinned to exact version
- Security updates MAY be automated via Dependabot/Renovate with tests gating merge

## Governance

This constitution supersedes all other project documentation when conflicts arise. Amendments
require:

1. Documented rationale for the change
2. Version bump following semantic versioning:
   - MAJOR: Backward-incompatible principle removal or redefinition
   - MINOR: New principle or materially expanded guidance
   - PATCH: Clarifications, wording, or non-semantic refinements
3. Update to dependent templates if principles affect their structure

All code reviews MUST verify compliance with these principles. Complexity beyond what is
necessary for the current task MUST be justified in PR descriptions.

**Version**: 1.0.0 | **Ratified**: 2025-12-31 | **Last Amended**: 2025-12-31
