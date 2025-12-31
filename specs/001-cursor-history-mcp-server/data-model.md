# Data Model: Cursor History MCP Server

**Date**: 2025-12-31
**Feature**: 001-cursor-history-mcp-server

## Overview

This MCP server is a thin wrapper around the `cursor-history` library. The data model documented
here reflects the types returned by cursor-history and how they map to MCP tool responses.

The server does NOT define its own persistence layer; all data resides in Cursor's SQLite database
and is accessed through the cursor-history library.

## Entities

### Session

A chat conversation with Cursor AI.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Internal session ID (UUID or composer ID) |
| index | number | 1-based index for user-friendly reference |
| workspacePath | string \| null | Absolute path to associated project folder |
| workspaceName | string \| null | Folder name extracted from path |
| messageCount | number | Total messages in the session |
| createdAt | Date | When the session was created |
| updatedAt | Date | When the session was last modified |
| firstMessagePreview | string | Truncated preview of the first user message |

**Source**: `listSessions()` return type

### SessionDetail

Full session content including all messages.

| Field | Type | Description |
|-------|------|-------------|
| ...Session | - | All Session fields |
| messages | Message[] | Complete list of messages in order |

**Source**: `getSession()` return type

### Message

An individual exchange within a session.

| Field | Type | Description |
|-------|------|-------------|
| role | "user" \| "assistant" \| "tool" \| "thinking" \| "error" | Message type |
| content | string | Message text content |
| timestamp | Date | When the message was sent |
| toolName | string \| null | Tool name if role is "tool" |
| toolParams | object \| null | Tool parameters if role is "tool" |
| toolResult | string \| null | Tool output if role is "tool" |
| status | "completed" \| "pending" \| "failed" \| null | Tool execution status |

**Source**: Inferred from cursor-history `getSession()` message structure

### SearchResult

A search match within a session.

| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | ID of the matching session |
| sessionIndex | number | Index for user reference |
| workspaceName | string \| null | Workspace where match found |
| match | string | The matching text with context |
| messageIndex | number | Which message contains the match |

**Source**: `searchSessions()` return type

### BackupManifest

Metadata about a backup archive.

| Field | Type | Description |
|-------|------|-------------|
| version | string | Backup format version |
| createdAt | Date | When backup was created |
| stats.sessionCount | number | Number of sessions in backup |
| stats.messageCount | number | Total messages across all sessions |
| stats.fileSize | number | Backup file size in bytes |

**Source**: `createBackup()` return type

### BackupResult

Result of a backup operation.

| Field | Type | Description |
|-------|------|-------------|
| backupPath | string | Absolute path to created backup file |
| manifest | BackupManifest | Metadata about the backup |

**Source**: `createBackup()` return type

### RestoreResult

Result of a restore operation.

| Field | Type | Description |
|-------|------|-------------|
| filesRestored | number | Number of files restored |
| sessionsRestored | number | Number of sessions restored |

**Source**: `restoreBackup()` return type

### MigrateResult

Result of a migration operation.

| Field | Type | Description |
|-------|------|-------------|
| successCount | number | Sessions successfully migrated |
| failedCount | number | Sessions that failed to migrate |
| errors | string[] | Error messages for failed sessions |

**Source**: `migrateSession()` / `migrateWorkspace()` return type

## Error Types

The cursor-history library provides typed errors with type guards:

| Error Type | Type Guard | Meaning |
|------------|------------|---------|
| DatabaseNotFoundError | `isDatabaseNotFoundError()` | Cursor data path not found |
| DatabaseLockedError | `isDatabaseLockedError()` | SQLite database locked |
| SessionNotFoundError | `isSessionNotFoundError()` | Invalid session index |
| WorkspaceNotFoundError | `isWorkspaceNotFoundError()` | Workspace path not found |
| BackupError | `isBackupError()` | Backup operation failed |
| RestoreError | `isRestoreError()` | Restore operation failed |
| InvalidBackupError | `isInvalidBackupError()` | Backup file corrupted |

## State Transitions

### Session Lifecycle

Sessions are read-only from this server's perspective. The lifecycle is managed by Cursor IDE:

```
[Created by Cursor] → [Messages Added] → [Optionally Migrated] → [Optionally Backed Up]
```

### Backup/Restore Flow

```
[Live Data] --backup--> [Backup Archive] --restore--> [Live Data (overwritten)]
                                         --validate--> [Validation Result]
```

### Migration Flow

```
[Session in Workspace A] --migrate (move)--> [Session in Workspace B]
                         --migrate (copy)--> [Session in Workspace B] + [Original in A]
```

## Pagination

The cursor-history library uses offset-based pagination:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| limit | 20 | 1000 | Number of results per page |
| offset | 0 | - | Starting position |

Response includes pagination metadata:

```typescript
interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```
