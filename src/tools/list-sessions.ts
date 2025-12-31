/**
 * cursor_history_list tool - List Cursor AI chat sessions
 */

import { listSessions } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";

/**
 * Input schema for the list tool
 */
const ListInputSchema = z.object({
  limit: z.number().int().min(1).max(1000).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
  workspace: z.string().optional(),
});

/**
 * Tool definition for MCP
 */
export const listSessionsTool = {
  name: "cursor_history_list",
  description:
    "List Cursor AI chat sessions. Returns recent sessions with metadata including workspace, message count, and timestamps.",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: {
        type: "integer",
        description: "Maximum number of sessions to return (default: 20, max: 1000)",
        minimum: 1,
        maximum: 1000,
        default: 20,
      },
      offset: {
        type: "integer",
        description: "Number of sessions to skip for pagination (default: 0)",
        minimum: 0,
        default: 0,
      },
      workspace: {
        type: "string",
        description:
          "Filter sessions by workspace path (absolute path to project folder)",
      },
    },
    additionalProperties: false,
  },
};

/**
 * Handler for the list tool
 */
export async function handleListSessions(
  args: Record<string, unknown>
): Promise<string> {
  try {
    const parsed = ListInputSchema.parse(args);

    const result = listSessions({
      limit: parsed.limit,
      offset: parsed.offset,
      workspace: parsed.workspace,
    });

    // Format the result for display
    const sessions = result.data;
    const { pagination } = result;

    if (sessions.length === 0) {
      return "No Cursor chat sessions found.";
    }

    const lines: string[] = [
      `Found ${pagination.total} session(s). Showing ${sessions.length}:`,
      "",
    ];

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      if (!session) continue;

      // Extract workspace name from path
      const workspaceName = session.workspace
        ? session.workspace.split("/").pop() ?? session.workspace
        : "No workspace";
      const date = new Date(session.timestamp).toLocaleString();

      // Get first message preview
      const firstMessage = session.messages[0];
      const preview = firstMessage
        ? `"${firstMessage.content.slice(0, 50)}..."`
        : "(no messages)";

      const sessionIndex = pagination.offset + i + 1;
      lines.push(
        `#${sessionIndex} - ${workspaceName} (${date})`,
        `    ${session.messageCount} messages · ${preview}`,
        ""
      );
    }

    if (pagination.hasMore) {
      lines.push(
        `(${pagination.total - pagination.offset - sessions.length} more sessions available)`
      );
    }

    return lines.join("\n");
  } catch (error) {
    const mcpError = mapCursorHistoryError(error);
    if (isMcpError(mcpError)) {
      throw new Error(mcpError.message);
    }
    throw error;
  }
}
