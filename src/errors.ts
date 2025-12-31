/**
 * Error handling module for cursor-history-mcp
 * Maps cursor-history library errors to MCP error codes
 */

import {
  isDatabaseLockedError,
  isDatabaseNotFoundError,
  isSessionNotFoundError,
  isWorkspaceNotFoundError,
  isBackupError,
  isRestoreError,
  isInvalidBackupError,
} from "cursor-history";
import { MCP_ERROR_CODES, McpErrorCode } from "./types.js";

/**
 * MCP-compatible error response
 */
export interface McpError {
  code: McpErrorCode;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Error messages for each error code
 */
const ERROR_MESSAGES: Record<McpErrorCode, string> = {
  [MCP_ERROR_CODES.DATABASE_NOT_FOUND]:
    "Cursor data not found. Please ensure Cursor IDE is installed and has been used at least once.",
  [MCP_ERROR_CODES.DATABASE_LOCKED]:
    "Cursor database is locked. Please close Cursor IDE and try again, or retry read operations which may work.",
  [MCP_ERROR_CODES.SESSION_NOT_FOUND]:
    "Session not found. Please check the session index using cursor_history_list.",
  [MCP_ERROR_CODES.WORKSPACE_NOT_FOUND]:
    "Workspace not found. Please verify the workspace path exists.",
  [MCP_ERROR_CODES.BACKUP_FAILED]:
    "Backup operation failed. Check file permissions and available disk space.",
  [MCP_ERROR_CODES.RESTORE_FAILED]:
    "Restore operation failed. The backup file may be corrupted or inaccessible.",
  [MCP_ERROR_CODES.INVALID_BACKUP]:
    "Invalid or corrupted backup file. Please verify the backup file integrity.",
};

/**
 * Maps a cursor-history error to an MCP error response
 */
export function mapCursorHistoryError(error: unknown): McpError {
  if (isDatabaseNotFoundError(error)) {
    return {
      code: MCP_ERROR_CODES.DATABASE_NOT_FOUND,
      message: ERROR_MESSAGES[MCP_ERROR_CODES.DATABASE_NOT_FOUND],
    };
  }

  if (isDatabaseLockedError(error)) {
    return {
      code: MCP_ERROR_CODES.DATABASE_LOCKED,
      message: ERROR_MESSAGES[MCP_ERROR_CODES.DATABASE_LOCKED],
    };
  }

  if (isSessionNotFoundError(error)) {
    return {
      code: MCP_ERROR_CODES.SESSION_NOT_FOUND,
      message: ERROR_MESSAGES[MCP_ERROR_CODES.SESSION_NOT_FOUND],
    };
  }

  if (isWorkspaceNotFoundError(error)) {
    return {
      code: MCP_ERROR_CODES.WORKSPACE_NOT_FOUND,
      message: ERROR_MESSAGES[MCP_ERROR_CODES.WORKSPACE_NOT_FOUND],
    };
  }

  if (isBackupError(error)) {
    return {
      code: MCP_ERROR_CODES.BACKUP_FAILED,
      message: ERROR_MESSAGES[MCP_ERROR_CODES.BACKUP_FAILED],
    };
  }

  if (isRestoreError(error)) {
    return {
      code: MCP_ERROR_CODES.RESTORE_FAILED,
      message: ERROR_MESSAGES[MCP_ERROR_CODES.RESTORE_FAILED],
    };
  }

  if (isInvalidBackupError(error)) {
    return {
      code: MCP_ERROR_CODES.INVALID_BACKUP,
      message: ERROR_MESSAGES[MCP_ERROR_CODES.INVALID_BACKUP],
    };
  }

  // Unknown error - wrap it
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return {
    code: MCP_ERROR_CODES.DATABASE_NOT_FOUND, // Default error code
    message: errorMessage,
    data: {
      originalError: String(error),
    },
  };
}

/**
 * Wraps a tool handler function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<T | McpError> {
  try {
    return await fn();
  } catch (error) {
    return mapCursorHistoryError(error);
  }
}

/**
 * Type guard to check if a result is an MCP error
 */
export function isMcpError(result: unknown): result is McpError {
  return (
    typeof result === "object" &&
    result !== null &&
    "code" in result &&
    "message" in result &&
    typeof (result as McpError).code === "number" &&
    typeof (result as McpError).message === "string"
  );
}
