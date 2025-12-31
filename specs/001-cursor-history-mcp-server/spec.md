# Feature Specification: Cursor History MCP Server

**Feature Branch**: `001-cursor-history-mcp-server`
**Created**: 2025-12-31
**Status**: Draft
**Input**: User description: "Create MCP server wrapping cursor-history npm package with npx support"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Chat Sessions (Priority: P1)

A developer using Claude Code (or another MCP client) wants to browse their Cursor AI chat history directly from their current AI assistant. They ask Claude to "show my recent Cursor chats" and receive a formatted list of their chat sessions with timestamps, project names, and message counts.

**Why this priority**: This is the core read-only functionality that enables all other use cases. Without listing sessions, users cannot identify which conversations to view, search, or export.

**Independent Test**: Can be fully tested by configuring the MCP server in Claude Code and asking "list my Cursor chat sessions" - delivers immediate value by surfacing conversation history.

**Acceptance Scenarios**:

1. **Given** a user has Cursor installed with existing chat history, **When** they invoke the list sessions tool, **Then** they receive a list of sessions showing session index, timestamp, workspace name, message count, and a preview of the first message.

2. **Given** a user has chat history across multiple workspaces, **When** they invoke the list sessions tool with a workspace filter, **Then** they receive only sessions from that specific workspace.

3. **Given** a user has more than 20 sessions, **When** they invoke the list sessions tool without parameters, **Then** they receive the 20 most recent sessions with an indication that more exist.

---

### User Story 2 - View Full Conversation (Priority: P1)

A developer remembers having a useful conversation about authentication last week and wants to see the full conversation including all AI responses, tool calls, and code changes that were made.

**Why this priority**: Viewing session details is essential for extracting value from history. Users need to see complete conversations to find code snippets, understand past decisions, or continue where they left off.

**Independent Test**: Can be tested by asking Claude to "show me session #3" and verifying the complete conversation is returned with all message types (user, assistant, tool calls, thinking blocks).

**Acceptance Scenarios**:

1. **Given** a valid session index, **When** the user invokes the show session tool, **Then** they receive the full conversation with all messages, timestamps, and tool call details.

2. **Given** a session with file edits, **When** the user views that session, **Then** they see the full diff of changes made by the AI.

3. **Given** an invalid session index, **When** the user invokes the show session tool, **Then** they receive a clear error message indicating the session was not found.

---

### User Story 3 - Search Across History (Priority: P2)

A developer needs to find a conversation where they discussed "rate limiting" but doesn't remember which project or when it occurred. They search across all their Cursor history and find matching conversations with highlighted context.

**Why this priority**: Search enables users to find specific conversations without knowing when or where they occurred. This is high-value but depends on the list/view functionality being available first.

**Independent Test**: Can be tested by asking Claude to "search my Cursor history for 'database migration'" and verifying matching sessions are returned with context around the matches.

**Acceptance Scenarios**:

1. **Given** a search query, **When** the user invokes the search tool, **Then** they receive sessions containing matches with surrounding context highlighted.

2. **Given** a search query with no matches, **When** the user invokes the search tool, **Then** they receive a clear message indicating no results were found.

3. **Given** a search query matching many sessions, **When** the user invokes the search tool, **Then** results are limited to a reasonable number with indication of total matches.

---

### User Story 4 - Export Conversations (Priority: P2)

A developer wants to save an important conversation for documentation or sharing with teammates. They export it as Markdown to include in their project's docs folder.

**Why this priority**: Export enables users to preserve and share conversations outside of the MCP context. Useful but not required for basic functionality.

**Independent Test**: Can be tested by asking Claude to "export session #1 as markdown" and verifying a properly formatted Markdown document is returned.

**Acceptance Scenarios**:

1. **Given** a valid session index, **When** the user invokes the export tool with Markdown format, **Then** they receive a well-formatted Markdown document with the complete conversation.

2. **Given** a valid session index, **When** the user invokes the export tool with JSON format, **Then** they receive a JSON document containing all session data.

---

### User Story 5 - Backup History (Priority: P3)

A developer wants to create a backup of all their Cursor chat history before reinstalling their system. They use the backup tool to create a portable archive.

**Why this priority**: Backup is important for data safety but is a less frequent operation. The destructive operation warning (per constitution) makes this a more deliberate action.

**Independent Test**: Can be tested by asking Claude to "backup my Cursor chat history" and verifying a backup file is created at the specified location.

**Acceptance Scenarios**:

1. **Given** existing Cursor history, **When** the user invokes the backup tool, **Then** they receive confirmation of a successful backup with the file path and statistics (session count, size).

2. **Given** a backup already exists at the target path, **When** the user invokes the backup tool without force flag, **Then** they receive an error asking them to use the force option or choose a different path.

---

### User Story 6 - Restore from Backup (Priority: P3)

A developer has set up a new machine and wants to restore their Cursor chat history from a backup file. They use the restore tool and their history is available again.

**Why this priority**: Restore completes the backup workflow but is infrequent. The tool description MUST include a warning about this being a destructive operation (per constitution principle VII).

**Independent Test**: Can be tested by backing up history, clearing it, then restoring from the backup and verifying sessions are accessible again.

**Acceptance Scenarios**:

1. **Given** a valid backup file path, **When** the user invokes the restore tool, **Then** they see a warning about the operation being destructive and a suggestion to backup current data first.

2. **Given** a valid backup file and user confirmation, **When** the restore completes, **Then** the user receives confirmation with statistics about what was restored.

---

### User Story 7 - Migrate Sessions Between Workspaces (Priority: P3)

A developer has renamed their project folder and wants to move their chat history to associate with the new location. They use the migrate tool to transfer sessions.

**Why this priority**: Migration is a specialized operation for workspace reorganization. The tool description MUST include a destructive operation warning (per constitution principle VII).

**Independent Test**: Can be tested by creating sessions in workspace A, migrating to workspace B, and verifying sessions appear under the new workspace.

**Acceptance Scenarios**:

1. **Given** a valid session index and destination workspace, **When** the user invokes migrate, **Then** they see a warning about the operation modifying data and a suggestion to backup first.

2. **Given** the copy option is specified, **When** migration completes, **Then** the original session remains in place and a copy exists in the new workspace.

---

### Edge Cases

- What happens when Cursor is not installed or has no chat history?
  - System returns a clear error indicating Cursor data was not found at the expected location.

- What happens when the Cursor database is locked (Cursor is running)?
  - System returns a clear error suggesting the user close Cursor or explaining that read operations may work but writes may fail.

- What happens when a workspace path doesn't exist?
  - System returns an error indicating the workspace was not found.

- What happens when backup file is corrupted?
  - System returns an error after validation indicating the backup is invalid.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose MCP tools that wrap cursor-history library functions for listing, viewing, searching, and exporting sessions.
- **FR-002**: System MUST work with zero configuration, automatically detecting the Cursor data path based on the operating system.
- **FR-003**: System MUST support stdio transport for MCP communication.
- **FR-004**: System MUST be executable via `npx cursor-history-mcp` without prior installation.
- **FR-005**: System MUST return all errors as structured MCP error responses with appropriate error codes and human-readable messages.
- **FR-006**: System MUST include backup warnings in tool descriptions for all destructive operations (migrate, restore, delete).
- **FR-007**: System MUST support optional parameters for limiting results, filtering by workspace, and specifying output format.
- **FR-008**: System MUST provide a backup tool to facilitate the recommended backup-before-destructive-operation workflow.

### Key Entities

- **Session**: A chat conversation with Cursor AI, identified by index or internal ID. Contains messages, workspace association, timestamps, and message count.
- **Message**: An individual exchange within a session. Can be user input, AI response, tool call, thinking block, or error.
- **Workspace**: A project folder that sessions are associated with. Sessions can be filtered by workspace.
- **Backup**: A portable archive containing all chat history data, manifest with statistics, and integrity checksums.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can list their Cursor chat sessions within 2 seconds of invoking the tool.
- **SC-002**: Users can view any session's complete conversation within 3 seconds.
- **SC-003**: Users can search across all history and receive results within 5 seconds.
- **SC-004**: The server starts and responds to the MCP initialize handshake within 1 second.
- **SC-005**: All destructive operation tool descriptions include the required backup warning text.
- **SC-006**: Zero configuration is required - users can add the server to their MCP client config with just `npx cursor-history-mcp` and it works immediately.
- **SC-007**: All errors return structured MCP error responses that clients can display meaningfully to users.

## Assumptions

- Users have Cursor IDE installed with existing chat history in the standard platform location.
- Users are running Node.js 20+ (required by cursor-history package).
- The cursor-history package's library API provides all necessary functionality; no direct database access is needed.
- MCP clients will display tool descriptions to users, making the backup warnings visible.
