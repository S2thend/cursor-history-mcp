/**
 * cursor_history_search tool - Search across all sessions
 */

import { searchSessions } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";

/**
 * Input schema for the search tool
 */
const SearchInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(10).optional(),
  context: z.number().int().min(0).max(500).default(50).optional(),
});

/**
 * Tool definition for MCP
 */
export const searchTool = {
  name: "cursor_history_search",
  description:
    "Search across all Cursor AI chat sessions for a keyword or phrase. Returns matching sessions with context around each match.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "The search query (keyword or phrase to find)",
        minLength: 1,
      },
      limit: {
        type: "integer",
        description: "Maximum number of results to return (default: 10)",
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      context: {
        type: "integer",
        description:
          "Number of characters of context to show around each match (default: 50)",
        minimum: 0,
        maximum: 500,
        default: 50,
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
};

/**
 * Handler for the search tool
 */
export async function handleSearch(
  args: Record<string, unknown>
): Promise<string> {
  try {
    const parsed = SearchInputSchema.parse(args);

    const results = await searchSessions(parsed.query, {
      limit: parsed.limit,
      context: parsed.context,
    });

    if (results.length === 0) {
      return `No matches found for "${parsed.query}".`;
    }

    const lines: string[] = [
      `Found ${results.length} match(es) for "${parsed.query}":`,
      "",
    ];

    for (const result of results) {
      // Extract workspace name from the session's workspace path
      const workspaceName = result.session.workspace
        ? result.session.workspace.split("/").pop() ?? result.session.workspace
        : "No workspace";

      lines.push(
        `Session (${workspaceName}):`,
        `  "${result.match}"`,
        ""
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
