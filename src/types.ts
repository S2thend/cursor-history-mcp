/**
 * TypeScript type definitions for cursor-history-mcp
 * These types represent the data structures returned by MCP tools
 */

/**
 * A chat session with Cursor AI
 */
export interface Session {
  id: string;
  index: number;
  workspacePath: string | null;
  workspaceName: string | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  firstMessagePreview: string;
}

/**
 * Message role types
 */
export type MessageRole = "user" | "assistant" | "tool" | "thinking" | "error";

/**
 * Tool execution status
 */
export type ToolStatus = "completed" | "pending" | "failed" | null;

/**
 * An individual message within a session
 */
export interface Message {
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolName: string | null;
  toolParams: Record<string, unknown> | null;
  toolResult: string | null;
  status: ToolStatus;
}

/**
 * Full session content including all messages
 */
export interface SessionDetail extends Session {
  messages: Message[];
}

/**
 * A search match within a session
 */
export interface SearchResult {
  sessionId: string;
  sessionIndex: number;
  workspaceName: string | null;
  match: string;
  messageIndex: number;
}

/**
 * Backup manifest metadata
 */
export interface BackupManifest {
  version: string;
  createdAt: Date;
  stats: {
    sessionCount: number;
    messageCount: number;
    fileSize: number;
  };
}

/**
 * Result of a backup operation
 */
export interface BackupResult {
  backupPath: string;
  manifest: BackupManifest;
}

/**
 * Result of a restore operation
 */
export interface RestoreResult {
  filesRestored: number;
  sessionsRestored: number;
}

/**
 * Result of a migration operation
 */
export interface MigrateResult {
  successCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Pagination metadata
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * MCP error codes for cursor-history errors
 */
export const MCP_ERROR_CODES = {
  DATABASE_NOT_FOUND: -32001,
  DATABASE_LOCKED: -32002,
  SESSION_NOT_FOUND: -32003,
  WORKSPACE_NOT_FOUND: -32004,
  BACKUP_FAILED: -32005,
  RESTORE_FAILED: -32006,
  INVALID_BACKUP: -32007,
} as const;

export type McpErrorCode = (typeof MCP_ERROR_CODES)[keyof typeof MCP_ERROR_CODES];
