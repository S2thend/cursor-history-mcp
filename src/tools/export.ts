/**
 * cursor_history_export tool - Export session to Markdown or JSON
 */

import { exportSessionToMarkdown, exportSessionToJson } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";
import { sessionSelectorShape, hasOneSelector, sessionSelectorProperties, sessionSelectorAlternatives, readSelector, readConfig } from "./history-context.js";

/**
 * Input schema for the export tool
 */
const ExportInputSchema = z.object({
  ...sessionSelectorShape,
  format: z.enum(["markdown", "json"]).default("markdown").optional(),
}).refine(hasOneSelector, "Provide exactly one of sessionIndex or sessionId");

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
      ...sessionSelectorProperties,
      format: {
        type: "string",
        description:
          "Export format: 'markdown' for human-readable, 'json' for structured data",
        enum: ["markdown", "json"],
        default: "markdown",
      },
    },
    oneOf: sessionSelectorAlternatives,
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
    const index = readSelector(parsed);

    if (format === "json") {
      return await exportSessionToJson(index, readConfig(parsed));
    } else {
      const result = await exportSessionToMarkdown(index, readConfig(parsed));
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
