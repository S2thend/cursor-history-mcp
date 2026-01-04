# Tasks: Year-Pack Generator

**Input**: Design documents from `/specs/002-year-pack-generator/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not explicitly requested in spec. Unit tests included for critical modules (sanitizer, analyzer, topics) per plan.md structure.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Core Generation, US2 = Workspace Filter, US3 = Language Selection
- Paths use `src/tools/year-pack/` subdirectory structure from plan.md

---

## Phase 1: Setup

**Purpose**: Create directory structure and type definitions

- [x] T001 Create year-pack tool directory structure at src/tools/year-pack/
- [x] T002 [P] Define YearPack types in src/tools/year-pack/types.ts (from data-model.md)
- [x] T003 [P] Define input validation schema with Zod in src/tools/year-pack/types.ts
- [x] T004 [P] Create English stopwords list in src/tools/year-pack/stopwords.ts
- [x] T005 [P] Create Chinese stopwords list in src/tools/year-pack/stopwords.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement text sanitizer (code blocks, commands removal) in src/tools/year-pack/sanitizer.ts
- [x] T007 Add path/URL/email/IP masking to sanitizer in src/tools/year-pack/sanitizer.ts
- [x] T008 Add secret detection and masking to sanitizer in src/tools/year-pack/sanitizer.ts
- [x] T009 Add truncation with [TRUNCATED] marker to sanitizer in src/tools/year-pack/sanitizer.ts
- [x] T010 [P] Implement regex tokenizer in src/tools/year-pack/analyzer.ts
- [x] T011 [P] Implement unigram/bigram frequency counter in src/tools/year-pack/analyzer.ts
- [x] T012 Implement TF-IDF calculation in src/tools/year-pack/topics.ts
- [x] T013 Implement K-Means clustering with k-means++ init in src/tools/year-pack/topics.ts
- [x] T014 Implement topic naming from cluster keywords in src/tools/year-pack/topics.ts
- [x] T015 [P] Unit test sanitizer (paths, URLs, secrets masking) in tests/unit/year-pack/sanitizer.test.ts
- [x] T016 [P] Unit test analyzer (tokenizer, frequency) in tests/unit/year-pack/analyzer.test.ts
- [x] T017 [P] Unit test topics (TF-IDF, K-Means) in tests/unit/year-pack/topics.test.ts

**Checkpoint**: Foundation ready - all sanitization, analysis, and topic extraction utilities tested

---

## Phase 3: User Story 1 - Generate Annual Report Data (Priority: P1) 🎯 MVP

**Goal**: Generate year_pack JSON with stats, keywords, topics, samples + prompt template for a specified year

**Independent Test**: Invoke tool with `{ year: 2025 }`, verify output contains valid year_pack structure with all required fields and a usable prompt template

### Implementation for User Story 1

- [x] T018 [US1] Implement session fetching with year filtering in src/tools/year-pack/index.ts
- [x] T019 [US1] Extract user-only messages from sessions in src/tools/year-pack/index.ts
- [x] T020 [US1] Implement pagination handling for large session counts in src/tools/year-pack/index.ts
- [x] T021 [US1] Implement statistics calculation (total, monthly, length buckets) in src/tools/year-pack/analyzer.ts
- [x] T022 [US1] Implement week aggregation for topic extraction in src/tools/year-pack/topics.ts
- [x] T023 [US1] Implement topic trend calculation (early/mid/late) in src/tools/year-pack/topics.ts
- [x] T024 [US1] Implement graceful degradation (<50 questions = skip topics) in src/tools/year-pack/topics.ts
- [x] T025 [US1] Implement safe sample selection (question-format preference) in src/tools/year-pack/analyzer.ts
- [x] T026 [US1] Implement English prompt template with section allowlists in src/tools/year-pack/prompt.ts
- [x] T027 [US1] Implement YearPack assembly (meta, stats, keywords, topics, samples, safety) in src/tools/year-pack/index.ts
- [x] T028 [US1] Define MCP tool schema and handler in src/tools/year-pack/index.ts
- [x] T029 [US1] Register year-pack tool in src/index.ts (TOOLS array and TOOL_HANDLERS)
- [x] T030 [US1] Integration test for full year-pack generation in tests/integration/year-pack.test.ts

**Checkpoint**: User Story 1 complete - tool generates valid year_pack for any year with English prompt

---

## Phase 4: User Story 2 - Filter by Workspace (Priority: P2)

**Goal**: Allow filtering analysis to a specific workspace/project

**Independent Test**: Invoke tool with `{ year: 2025, workspace: "/path/to/project" }`, verify only matching sessions are analyzed

### Implementation for User Story 2

- [x] T031 [US2] Add workspace parameter to session fetching in src/tools/year-pack/index.ts
- [x] T032 [US2] Include workspace in YearPackMeta output in src/tools/year-pack/index.ts
- [x] T033 [US2] Handle "no sessions found" case with helpful message in src/tools/year-pack/index.ts
- [x] T034 [US2] Test workspace filtering in tests/integration/year-pack.test.ts

**Checkpoint**: User Story 2 complete - workspace filtering works independently

---

## Phase 5: User Story 3 - Language Selection (Priority: P3)

**Goal**: Support English and Chinese prompt templates

**Independent Test**: Invoke tool with `{ year: 2025, language: "zh" }`, verify prompt template instructs Chinese report generation

### Implementation for User Story 3

- [x] T035 [US3] Create Chinese prompt template with section allowlists in src/tools/year-pack/prompt.ts
- [x] T036 [US3] Add language parameter handling in src/tools/year-pack/index.ts
- [x] T037 [US3] Select appropriate stopwords based on language in src/tools/year-pack/analyzer.ts
- [x] T038 [US3] Test language selection (en/zh prompts) in tests/integration/year-pack.test.ts

**Checkpoint**: User Story 3 complete - both English and Chinese prompts work

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting all user stories

- [x] T039 [P] Verify all error cases use existing error handling patterns in src/tools/year-pack/index.ts
- [x] T040 [P] Add performance logging (processing time) in src/tools/year-pack/index.ts
- [x] T041 Run `npm run typecheck` and fix any TypeScript errors
- [x] T042 Run `npm run lint` and fix any linting issues
- [x] T043 Run `npm test` and verify all tests pass
- [x] T044 Validate against quickstart.md scenarios manually
- [x] T045 Update package.json version if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (types needed for utilities)
- **User Story 1 (Phase 3)**: Depends on Foundational (needs all utilities)
- **User Story 2 (Phase 4)**: Depends on US1 (extends existing handler)
- **User Story 3 (Phase 5)**: Depends on US1 (extends existing handler)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Core implementation - no story dependencies
- **US2 (P2)**: Extends US1 handler with workspace filter - light dependency
- **US3 (P3)**: Extends US1 handler with language selection - light dependency

### Within Each Phase

- Types before implementations
- Utilities before consumers
- Unit tests alongside implementations
- Integration tests after feature complete

### Parallel Opportunities

**Phase 1 (all parallel)**:
- T002, T003, T004, T005 can run in parallel

**Phase 2 (partial parallel)**:
- T010, T011 (analyzer) parallel with T006-T009 (sanitizer)
- T015, T016, T017 (tests) parallel after implementations

**Phase 3+ (sequential within story)**:
- US2 and US3 could run in parallel if US1 is complete

---

## Parallel Example: Phase 1

```bash
# Launch all type/data tasks together:
Task: "Define YearPack types in src/tools/year-pack/types.ts"
Task: "Define input validation schema with Zod in src/tools/year-pack/types.ts"
Task: "Create English stopwords list in src/tools/year-pack/stopwords.ts"
Task: "Create Chinese stopwords list in src/tools/year-pack/stopwords.ts"
```

## Parallel Example: Phase 2 Tests

```bash
# Launch all unit tests together after implementations:
Task: "Unit test sanitizer in tests/unit/year-pack/sanitizer.test.ts"
Task: "Unit test analyzer in tests/unit/year-pack/analyzer.test.ts"
Task: "Unit test topics in tests/unit/year-pack/topics.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T017)
3. Complete Phase 3: User Story 1 (T018-T030)
4. **STOP and VALIDATE**: Test with real cursor-history data
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Core utilities ready
2. Add User Story 1 → MVP: Generate year-pack for any year
3. Add User Story 2 → Enhanced: Filter by workspace
4. Add User Story 3 → Complete: Multi-language support
5. Polish → Production ready

---

## Notes

- All NLP logic is pure TypeScript (no external NLP libraries per research.md)
- Uses read-only APIs only (listSessions, getSession from cursor-history)
- Graceful degradation: <50 questions → skip topics, return stats only
- Performance target: <10 seconds for 20,000 questions
- Sanitization is security-critical: paths, URLs, secrets must be masked
