/**
 * cursor_history_export tool - Export session to Markdown or JSON
 */

import { exportSessionToMarkdown, exportSessionToJson } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";

/**
 * Input schema for the export tool
 */
const ExportInputSchema = z.object({
  sessionIndex: z.number().int().min(1),
  format: z.enum(["markdown", "json"]).default("markdown").optional(),
});

/**
 * Tool definition for MCP
 */
export const exportTool = {
  name: "cursor_history_export",
  description:
    "Export a Cursor AI chat session to Markdown or JSON format. Returns the formatted content.",
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionIndex: {
        type: "integer",
        description: "The session index (1-based, as shown in list output)",
        minimum: 1,
      },
      format: {
        type: "string",
        description:
          "Export format: 'markdown' for human-readable, 'json' for structured data",
        enum: ["markdown", "json"],
        default: "markdown",
      },
    },
    required: ["sessionIndex"],
    additionalProperties: false,
  },
};

/**
 * Handler for the export tool
 */
export async function handleExport(
  args: Record<string, unknown>
): Promise<string> {
  try {
    const parsed = ExportInputSchema.parse(args);
    const format = parsed.format ?? "markdown";

    // cursor-history uses 0-based indexing internally
    const index = parsed.sessionIndex - 1;

    if (format === "json") {
      const result = exportSessionToJson(index);
      return JSON.stringify(result, null, 2);
    } else {
      const result = exportSessionToMarkdown(index);
      return result;
    }
  } catch (error) {
    const mcpError = mapCursorHistoryError(error);
    if (isMcpError(mcpError)) {
      throw new Error(mcpError.message);
    }
    throw error;
  }
}
