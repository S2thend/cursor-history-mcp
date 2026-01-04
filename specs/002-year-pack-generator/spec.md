# Feature Specification: Year-Pack Generator

**Feature Branch**: `002-year-pack-generator`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Add a year-pack generator MCP tool that produces a sanitized JSON summary (year_pack) of annual chat data plus a prompt template for generating an entertainment-focused annual report"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Annual Report Data (Priority: P1)

A user wants to generate an entertainment-focused "year in review" report from their Cursor AI chat history. They invoke the year-pack tool which analyzes all their chat sessions from a specified year, extracts statistics and themes, and outputs a sanitized data package along with a prompt template that can be fed to an LLM to generate a personalized annual report.

**Why this priority**: This is the core value proposition - transforming raw chat data into a safe, structured format suitable for entertaining narrative generation without exposing sensitive information.

**Independent Test**: Can be fully tested by invoking the tool with a year parameter and verifying the output contains valid year_pack JSON structure with stats, topics, keywords, and a usable prompt template.

**Acceptance Scenarios**:

1. **Given** a user has Cursor chat history spanning 2025, **When** they invoke the year-pack tool for year 2025, **Then** they receive a JSON year_pack containing statistics, topics, keywords, and safe samples
2. **Given** the year-pack is generated, **When** the output is examined, **Then** it includes a prompt template that can be used with any LLM to generate a narrative report
3. **Given** chat history contains sensitive data (file paths, URLs, secrets), **When** year-pack is generated, **Then** all sensitive content is sanitized or excluded from the output

---

### User Story 2 - Filter by Workspace (Priority: P2)

A user wants to generate a year-pack for a specific project/workspace rather than all their chat history. They specify a workspace path filter and receive analysis limited to that context.

**Why this priority**: Enables focused analysis per-project, useful for users who work on multiple projects and want project-specific insights.

**Independent Test**: Can be tested by providing a workspace filter and verifying only sessions from that workspace are included in statistics.

**Acceptance Scenarios**:

1. **Given** a user has sessions from multiple workspaces, **When** they specify a workspace filter, **Then** only sessions matching that workspace are analyzed
2. **Given** a workspace filter that matches no sessions, **When** year-pack is generated, **Then** appropriate feedback is provided indicating no data found

---

### User Story 3 - Language Selection (Priority: P3)

A user wants the prompt template and report structure optimized for their preferred language (English or Chinese).

**Why this priority**: Supports internationalization for primary user languages without requiring translation of the entire system.

**Independent Test**: Can be tested by specifying language preference and verifying the prompt template contains appropriate language instructions.

**Acceptance Scenarios**:

1. **Given** user selects English language, **When** year-pack is generated, **Then** the prompt template instructs report generation in English
2. **Given** user selects Chinese language, **When** year-pack is generated, **Then** the prompt template instructs report generation in Chinese

---

### Edge Cases

- What happens when no chat sessions exist for the specified year?
- How does the system handle sessions with only assistant/tool messages and no user questions?
- What happens when total questions are fewer than 50? System degrades gracefully: skips topic extraction and returns statistics only
- How does the system handle extremely long individual messages that exceed truncation limits?
- What happens when the chat history database is locked or inaccessible?

## Requirements *(mandatory)*

### Functional Requirements

#### Data Collection & Filtering
- **FR-001**: System MUST retrieve all chat sessions within the specified calendar year (January 1 to December 31)
- **FR-002**: System MUST extract only user-role messages from sessions, excluding assistant/tool/system messages
- **FR-003**: System MUST support optional workspace filtering to limit analysis scope
- **FR-004**: System MUST handle pagination when retrieving large numbers of sessions
- **FR-005**: System MUST use only read-only APIs; no modifications to chat history data are permitted

#### Text Sanitization (Security-Critical)
- **FR-006**: System MUST remove all code blocks from user messages before analysis
- **FR-007**: System MUST remove all shell/command-line content (lines starting with $, >, #, or containing npm/git/python commands)
- **FR-008**: System MUST replace file paths with placeholder `[PATH]`
- **FR-009**: System MUST replace URLs with placeholder `[URL]`
- **FR-010**: System MUST replace email addresses with placeholder `[EMAIL]`
- **FR-011**: System MUST replace IP addresses with placeholder `[IP]`
- **FR-012**: System MUST replace tokens/secrets/API keys with placeholder `[SECRET]`
- **FR-013**: System MUST truncate individual messages exceeding configurable character limit, appending `[TRUNCATED]`

#### Statistical Analysis
- **FR-014**: System MUST count total user questions for the year
- **FR-015**: System MUST count active months (months with at least one question)
- **FR-016**: System MUST calculate monthly question distribution
- **FR-017**: System MUST categorize questions into length buckets: short (0-100 chars), medium (100-280 chars), long (280+ chars)

#### Keyword Extraction
- **FR-018**: System MUST extract top unigrams (single words) by frequency, excluding common stopwords
- **FR-019**: System MUST extract top bigrams (word pairs) by frequency
- **FR-020**: System MUST limit vocabulary to configurable maximum (default: 3000 terms)
- **FR-021**: System MUST apply minimum document frequency threshold (term must appear in at least N documents)
- **FR-022**: System MUST apply maximum document frequency ratio (exclude terms appearing in more than X% of documents)

#### Topic Extraction
- **FR-023**: System MUST aggregate questions by week (approximately 52 aggregated documents per year)
- **FR-024**: System MUST extract configurable number of topics (default: 7) using TF-IDF and clustering
- **FR-025**: System MUST calculate each topic's share (proportion of total content)
- **FR-026**: System MUST calculate topic trends across three periods: early (Jan-Apr), mid (May-Aug), late (Sep-Dec)
- **FR-027**: System MUST assign descriptive keywords to each topic
- **FR-028**: System MUST skip topic extraction and return statistics only when total questions are fewer than 50 (graceful degradation)

#### Safe Samples
- **FR-029**: System MUST select a limited set of representative sample questions (default: max 30)
- **FR-030**: System MUST ensure each sample is under configurable character limit
- **FR-031**: System MUST re-validate samples for sensitive content before inclusion
- **FR-032**: System MUST prefer question-format samples (ending with ? or starting with question words)

#### Output Generation
- **FR-033**: System MUST produce a structured year_pack JSON object containing all analysis results
- **FR-034**: System MUST include safety metadata documenting applied filters and guarantees
- **FR-035**: System MUST generate a prompt template designed for LLM report generation
- **FR-036**: System MUST include section-specific field allowlists in the prompt (which data can be used for each report section)
- **FR-037**: System MUST output both year_pack JSON and prompt template as the tool response

#### Performance
- **FR-038**: System MUST complete analysis within reasonable time for typical usage (approximately 20,000 questions)
- **FR-039**: System MUST use memory-efficient processing (week aggregation before intensive analysis)

### Key Entities

- **YearPack**: The complete output structure containing meta, stats, lengthBuckets, keywords, topics, samples, safety, and notes
- **Topic**: A thematic cluster with name, share percentage, associated keywords, and trend data across year periods
- **KeywordItem**: A term with its frequency count
- **SafeSample**: A sanitized, truncated user question suitable for inclusion in the report

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Year-pack generation completes within 10 seconds for a dataset of 20,000 questions
- **SC-002**: 100% of file paths, URLs, emails, IPs, and detected secrets are sanitized in the output
- **SC-003**: Generated year_pack validates against the defined schema with no missing required fields
- **SC-004**: The prompt template, when used with the year_pack, enables an LLM to generate all 9 report sections (Title, Poem, Highlights, Stats, Style, Awards, Archetype, Timeline, Future)
- **SC-005**: No executable content (code, commands) appears in any output field
- **SC-006**: Safe samples are limited to maximum configured count and each under maximum configured length
- **SC-007**: Topic extraction produces between 5-10 distinct, non-overlapping themes when sufficient data exists

## Clarifications

### Session 2026-01-04

- Q: What happens when total questions are fewer than the minimum required for meaningful topic extraction? → A: Degrade gracefully: skip topic extraction if <50 questions, return stats only
- Q: Should the tool modify any chat history data? → A: No, all operations must use read-only APIs only
- Q: What is the priority when selecting libraries/dependencies for NLP/analysis? → A: Compatibility is the first concern (ESM + TypeScript + Node 20+), then speed, then accuracy

## Assumptions

- Users have existing Cursor AI chat history accessible via the cursor-history library
- The entertainment report is non-critical; reasonable defaults are acceptable where user preferences are unspecified
- English and Chinese are the primary supported languages; other languages may work but are not specifically optimized
- The regex-based tokenization is sufficient for entertainment purposes; linguistic precision is not required
- Week-based aggregation (52 documents) provides adequate granularity for trend analysis while maintaining performance
- Stopword lists are static and language-specific (English stopwords for English analysis)

## Constraints

- **Library Selection Priority**: When evaluating dependencies for NLP/analysis, prioritize in this order:
  1. **Compatibility** (ESM + TypeScript + Node 20+ support)
  2. **Speed** (performance for ~20k questions)
  3. **Accuracy** (acceptable for entertainment use case)
- Prefer pure regex/native JS implementations over third-party NLP libraries when they meet requirements
- Zero or minimal external dependencies preferred for text processing

## Scope Boundaries

### In Scope
- Data extraction from Cursor chat history
- Text sanitization and security filtering
- Statistical analysis and visualization data
- Topic extraction using TF-IDF and clustering
- Prompt template generation for LLM-based report writing
- English and Chinese language support

### Out of Scope
- Actual report narrative generation (that's the LLM's job using the prompt)
- Neural network-based NLP (using lightweight regex/statistical methods only)
- Real-time or streaming analysis
- Historical comparison across multiple years
- Export to specific document formats (PDF, DOCX, etc.)
- User interface beyond MCP tool interface
