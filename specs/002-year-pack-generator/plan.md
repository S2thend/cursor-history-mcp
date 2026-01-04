# Implementation Plan: Year-Pack Generator

**Branch**: `002-year-pack-generator` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-year-pack-generator/spec.md`

## Summary

Add an MCP tool `cursor_history_year_pack` that generates a sanitized JSON summary (year_pack) of annual chat data plus a prompt template for generating an entertainment-focused annual report. The tool uses read-only APIs to collect user questions from a specified year, sanitizes sensitive content, extracts statistics/keywords/topics using lightweight regex and TF-IDF clustering, and outputs a structured data package suitable for LLM-based report generation.

## Technical Context

**Language/Version**: TypeScript 5.7.2 with Node.js 20+
**Primary Dependencies**: `@modelcontextprotocol/sdk` 1.0.0, `cursor-history` 0.9.1, `zod` 3.24.1
**Storage**: N/A (read-only access to cursor-history SQLite database)
**Testing**: vitest 2.1.8
**Target Platform**: Node.js 20+ (macOS, Linux, Windows via npx)
**Project Type**: Single project (MCP server CLI tool)
**Performance Goals**: <10 seconds for 20,000 questions
**Constraints**: Read-only APIs only, ESM + TypeScript compatibility first, minimal external dependencies
**Scale/Scope**: ~20,000 user questions per year typical

**NLP/Analysis Approach**: Pure TypeScript (see [research.md](./research.md))
- TF-IDF implementation: Pure TypeScript (~80 lines)
- K-Means clustering: Pure TypeScript (~120 lines)
- Tokenization: Pure regex (~30 lines)
- Rationale: Compatibility first, zero dependencies, sufficient for entertainment use case

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. MCP Protocol Compliance | ✅ PASS | New tool follows existing MCP tool patterns |
| II. Thin Wrapper Architecture | ✅ PASS | Uses cursor-history read APIs, adds analysis layer |
| III. Zero Configuration Default | ✅ PASS | Default year = current year, no required config |
| IV. npx-First Distribution | ✅ PASS | Bundled with existing binary |
| V. Structured Error Handling | ✅ PASS | Will use existing error handling patterns |
| VI. TypeScript Strict Mode | ✅ PASS | Project already uses strict: true |
| VII. Destructive Operation Safety | ✅ PASS | Read-only tool, no destructive operations |

**Gate Result**: PASS - All principles satisfied

### Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. MCP Protocol Compliance | ✅ PASS | Tool schema follows MCP patterns (see contracts/) |
| II. Thin Wrapper Architecture | ✅ PASS | Uses listSessions/getSession read APIs only |
| III. Zero Configuration Default | ✅ PASS | All params optional, sensible defaults |
| IV. npx-First Distribution | ✅ PASS | No new runtime dependencies |
| V. Structured Error Handling | ✅ PASS | Reuses existing error patterns |
| VI. TypeScript Strict Mode | ✅ PASS | All types defined in data-model.md |
| VII. Destructive Operation Safety | ✅ PASS | Read-only, no backup warning needed |

**Post-Design Gate Result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-year-pack-generator/
├── plan.md              # This file
├── research.md          # Phase 0 output - NLP library decisions
├── data-model.md        # Phase 1 output - YearPack schema
├── quickstart.md        # Phase 1 output - Usage guide
├── contracts/           # Phase 1 output - MCP tool schema
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts             # MCP server (add tool registration)
├── errors.ts            # Error handling (reuse)
├── types.ts             # Types (add YearPack types)
└── tools/
    ├── list-sessions.ts # Existing tool
    ├── show-session.ts  # Existing tool
    ├── search.ts        # Existing tool
    ├── export.ts        # Existing tool
    ├── backup.ts        # Existing tool
    ├── restore.ts       # Existing tool
    ├── migrate.ts       # Existing tool
    └── year-pack/       # NEW: Year-pack tool module
        ├── index.ts     # Tool definition and handler
        ├── types.ts     # YearPack-specific types
        ├── sanitizer.ts # Text sanitization utilities
        ├── analyzer.ts  # Statistics and keyword extraction
        ├── topics.ts    # TF-IDF and clustering
        ├── prompt.ts    # Prompt template generation
        └── stopwords.ts # Stopword lists (en/zh)

tests/
├── unit/
│   └── year-pack/
│       ├── sanitizer.test.ts
│       ├── analyzer.test.ts
│       └── topics.test.ts
└── integration/
    └── year-pack.test.ts
```

**Structure Decision**: New tool follows existing single-file-per-tool pattern but uses a subdirectory due to complexity. Analysis logic is split into focused modules (sanitizer, analyzer, topics) for testability.

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Subdirectory for tool | `tools/year-pack/` | Tool has 5+ modules; keeps main tools/ clean |
| No external NLP libs | Pure regex + JS | Per constraint: compatibility > speed > accuracy |
