/**
 * cursor_history_show tool - Show full session content
 */

import { getSession } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";
import { sessionSelectorShape, hasOneSelector, sessionSelectorProperties, sessionSelectorAlternatives, readSelector, readConfig, sourceSummary, formatTimestamp } from "./history-context.js";

/**
 * Input schema for the show tool
 */
const ShowInputSchema = z.object(sessionSelectorShape).refine(hasOneSelector, "Provide exactly one of sessionIndex or sessionId");

/**
 * Tool definition for MCP
 */
export const showSessionTool = {
  name: "cursor_history_show",
  description:
    "Inspect the available messages and tool activity in a Cursor session, with source and timestamp provenance. Long thinking and tool payloads are abbreviated; use export for unabridged available content.",
  inputSchema: {
    type: "object" as const,
    properties: sessionSelectorProperties,
    oneOf: sessionSelectorAlternatives,
    additionalProperties: false,
  },
};

/**
 * Handler for the show tool
 */
export async function handleShowSession(
  args: Record<string, unknown>
): Promise<string> {
  try {
    const parsed = ShowInputSchema.parse(args);

    // cursor-history uses 0-based indexing internally
    const session = await getSession(readSelector(parsed), readConfig(parsed));

    // Extract workspace name from path
    const workspaceName = session.workspace
      ? session.workspace.split("/").pop() ?? session.workspace
      : "No workspace";
    const date = formatTimestamp(session.timestamp, session.createdAtSource);

    const lines: string[] = [
      `Session ${parsed.sessionIndex === undefined ? session.id : `#${parsed.sessionIndex}`} · ${workspaceName}`,
      `ID: ${session.id}`,
      sourceSummary(session),
      `${session.messageCount} messages · Created ${date}`,
      "",
      "─".repeat(40),
      "",
    ];

    for (const message of session.messages) {
      const timestamp = formatTimestamp(message.timestamp, message.timestampSource);
      const roleLabel = message.role === "user" ? "You" : "Assistant";

      lines.push(`${roleLabel}: ${timestamp}`, "");

      // Handle tool calls in assistant messages
      if (message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0) {
        for (const toolCall of message.toolCalls) {
          lines.push(`🔧 ${toolCall.name}`);
          if (toolCall.params) {
            lines.push(`   Params: ${JSON.stringify(toolCall.params)}`);
          }
          if (toolCall.result) {
            const truncated =
              toolCall.result.length > 500
                ? toolCall.result.slice(0, 500) + "..."
                : toolCall.result;
            lines.push(`   Result: ${truncated}`);
          }
          const statusIcon = toolCall.status === "completed" ? "✓" : "✗";
          lines.push(`   Status: ${statusIcon} ${toolCall.status}`);
        }
        lines.push("");
      }

      // Handle thinking text
      if (message.role === "assistant" && message.thinking) {
        lines.push(`💭 ${message.thinking.slice(0, 200)}...`, "");
      }

      // Regular message content
      lines.push(message.content);

      lines.push("", "─".repeat(40), "");
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
