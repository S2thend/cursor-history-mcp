# Tasks: Cursor History MCP Server

**Input**: Design documents from `/specs/001-cursor-history-mcp-server/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification. Tasks focus on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure: src/, src/tools/, tests/
- [x] T002 Initialize npm package with package.json including name, version, bin entry, and dependencies
- [x] T003 [P] Create tsconfig.json with strict: true and ES module configuration
- [x] T004 [P] Create .gitignore for node_modules, dist/, and common artifacts
- [x] T005 Install dependencies: @modelcontextprotocol/server, cursor-history@0.8.0, zod, typescript, tsup
- [x] T005b [P] Configure ESLint with TypeScript support in eslint.config.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create TypeScript type definitions in src/types.ts (Session, Message, SearchResult, BackupResult, MigrateResult types)
- [x] T007 Implement error handling module in src/errors.ts with MCP error code mapping for all cursor-history errors
- [x] T008 Create MCP server entry point skeleton in src/index.ts with stdio transport and tool registration
- [x] T009 Configure tsup build in tsup.config.ts for bundling with bin entry point

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse Chat Sessions (Priority: P1) 🎯 MVP

**Goal**: Users can list their Cursor AI chat sessions with metadata

**Independent Test**: Configure MCP server in Claude Code and ask "list my Cursor chat sessions"

### Implementation for User Story 1

- [x] T010 [US1] Implement cursor_history_list tool handler in src/tools/list-sessions.ts
- [x] T011 [US1] Add JSON Schema for list tool input parameters in src/tools/list-sessions.ts
- [x] T012 [US1] Register list tool in src/index.ts with tool definition and handler
- [x] T013 [US1] Add error handling for DatabaseNotFound and DatabaseLocked errors in list tool

**Checkpoint**: User Story 1 complete - users can list sessions via MCP

---

## Phase 4: User Story 2 - View Full Conversation (Priority: P1) 🎯 MVP

**Goal**: Users can view complete session content including all messages

**Independent Test**: Ask Claude to "show me session #1" and verify full conversation returned

### Implementation for User Story 2

- [x] T014 [US2] Implement cursor_history_show tool handler in src/tools/show-session.ts
- [x] T015 [US2] Add JSON Schema for show tool input parameters in src/tools/show-session.ts
- [x] T016 [US2] Register show tool in src/index.ts with tool definition and handler
- [x] T017 [US2] Add error handling for SessionNotFound error in show tool

**Checkpoint**: User Stories 1 AND 2 complete - core read functionality works

---

## Phase 5: User Story 3 - Search Across History (Priority: P2)

**Goal**: Users can search across all sessions for keywords

**Independent Test**: Ask Claude to "search my Cursor history for 'authentication'"

### Implementation for User Story 3

- [x] T018 [US3] Implement cursor_history_search tool handler in src/tools/search.ts
- [x] T019 [US3] Add JSON Schema for search tool input parameters in src/tools/search.ts
- [x] T020 [US3] Register search tool in src/index.ts with tool definition and handler

**Checkpoint**: Search functionality added

---

## Phase 6: User Story 4 - Export Conversations (Priority: P2)

**Goal**: Users can export sessions as Markdown or JSON

**Independent Test**: Ask Claude to "export session #1 as markdown"

### Implementation for User Story 4

- [x] T021 [US4] Implement cursor_history_export tool handler in src/tools/export.ts
- [x] T022 [US4] Add JSON Schema for export tool input parameters with format enum in src/tools/export.ts
- [x] T023 [US4] Register export tool in src/index.ts with tool definition and handler

**Checkpoint**: Export functionality added

---

## Phase 7: User Story 5 - Backup History (Priority: P3)

**Goal**: Users can create portable backups of all chat history

**Independent Test**: Ask Claude to "backup my Cursor chat history"

### Implementation for User Story 5

- [x] T024 [US5] Implement cursor_history_backup tool handler in src/tools/backup.ts
- [x] T025 [US5] Add JSON Schema for backup tool input parameters in src/tools/backup.ts
- [x] T026 [US5] Register backup tool in src/index.ts with tool definition and handler
- [x] T027 [US5] Add error handling for BackupError in backup tool

**Checkpoint**: Backup functionality added

---

## Phase 8: User Story 6 - Restore from Backup (Priority: P3)

**Goal**: Users can restore chat history from backup files

**Independent Test**: Create backup, then ask Claude to "restore from backup [path]"

### Implementation for User Story 6

- [x] T028 [US6] Implement cursor_history_restore tool handler in src/tools/restore.ts with DESTRUCTIVE warning in description
- [x] T029 [US6] Add JSON Schema for restore tool input parameters in src/tools/restore.ts
- [x] T030 [US6] Register restore tool in src/index.ts with tool definition and handler
- [x] T031 [US6] Add error handling for RestoreError and InvalidBackupError in restore tool

**Checkpoint**: Restore functionality added with safety warning

---

## Phase 9: User Story 7 - Migrate Sessions (Priority: P3)

**Goal**: Users can move or copy sessions between workspaces

**Independent Test**: Ask Claude to "migrate session #1 to /path/to/project"

### Implementation for User Story 7

- [x] T032 [US7] Implement cursor_history_migrate tool handler in src/tools/migrate.ts with DESTRUCTIVE warning in description
- [x] T033 [US7] Add JSON Schema for migrate tool input parameters with mode enum in src/tools/migrate.ts
- [x] T034 [US7] Register migrate tool in src/index.ts with tool definition and handler
- [x] T035 [US7] Add error handling for WorkspaceNotFound error in migrate tool

**Checkpoint**: All user stories complete

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T036 [P] Add README.md with installation and usage instructions
- [x] T037 [P] Verify all tool descriptions match contracts/mcp-tools.json schema
- [x] T038 Build and test npx execution locally
- [x] T039 Validate quickstart.md instructions work end-to-end
- [x] T040 Final TypeScript compilation check with zero errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority - implement sequentially for MVP
  - US3 and US4 are P2 - can proceed after MVP
  - US5, US6, US7 are P3 - implement last
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Independent
- **User Story 7 (P3)**: Can start after Foundational (Phase 2) - Independent

### Within Each User Story

- Tool handler implementation first
- JSON Schema definition second
- Tool registration third
- Error handling last

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- All user story phases are independent and can run in parallel if desired
- T036 and T037 can run in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch parallel setup tasks:
Task: "Create tsconfig.json with strict: true and ES module configuration"
Task: "Create .gitignore for node_modules, dist/, and common artifacts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (list sessions)
4. Complete Phase 4: User Story 2 (show session)
5. **STOP and VALIDATE**: Test with Claude Code
6. npm publish for early users

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test → Publish v0.1.0 (MVP!)
3. Add US3 + US4 → Test → Publish v0.2.0 (Search + Export)
4. Add US5 + US6 + US7 → Test → Publish v0.3.0 (Backup/Restore/Migrate)
5. Polish → Publish v1.0.0

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable via MCP client
- Destructive tools (restore, migrate) MUST include backup warnings per constitution
- No test tasks included as not explicitly requested in spec
- Total: 40 tasks across 10 phases
