/**
 * cursor_history_migrate tool - Move or copy sessions between workspaces
 *
 * ⚠️ DESTRUCTIVE OPERATION: When moving (not copying), original sessions are deleted
 */

import { migrateSession } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";

/**
 * Input schema for the migrate tool
 */
const MigrateInputSchema = z.object({
  sessionIndexes: z.array(z.number().int().min(1)).min(1),
  destination: z.string(),
  mode: z.enum(["move", "copy"]).default("move").optional(),
});

/**
 * Tool definition for MCP
 */
export const migrateTool = {
  name: "cursor_history_migrate",
  description:
    "⚠️ DESTRUCTIVE: Move or copy chat sessions between workspaces. When moving (not copying), the original session is deleted. Consider creating a backup first using cursor_history_backup.",
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionIndexes: {
        type: "array",
        items: {
          type: "integer",
          minimum: 1,
        },
        description:
          "List of session indexes to migrate (1-based, as shown in list output)",
        minItems: 1,
      },
      destination: {
        type: "string",
        description: "Absolute path to the destination workspace folder",
      },
      mode: {
        type: "string",
        description: "Migration mode: 'move' deletes original, 'copy' keeps original",
        enum: ["move", "copy"],
        default: "move",
      },
    },
    required: ["sessionIndexes", "destination"],
    additionalProperties: false,
  },
};

/**
 * Handler for the migrate tool
 */
export async function handleMigrate(
  args: Record<string, unknown>
): Promise<string> {
  try {
    const parsed = MigrateInputSchema.parse(args);
    const mode = parsed.mode ?? "move";

    // Convert 1-based indexes to 0-based for the library
    const zeroBasedIndexes = parsed.sessionIndexes.map((i) => i - 1);

    const results = await migrateSession({
      sessions: zeroBasedIndexes,
      destination: parsed.destination,
      mode: mode,
    });

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    const errors = results.filter((r) => !r.success).map((r) => r.error ?? "Unknown error");

    const modeLabel = mode === "copy" ? "copied" : "moved";
    const lines: string[] = [];

    if (successCount > 0) {
      lines.push(
        `Successfully ${modeLabel} ${successCount} session(s) to:`,
        `📁 ${parsed.destination}`,
        ""
      );
    }

    if (failedCount > 0) {
      lines.push(`⚠️ Failed to migrate ${failedCount} session(s):`);
      for (const error of errors) {
        lines.push(`  • ${error}`);
      }
    }

    if (lines.length === 0) {
      lines.push("No sessions were migrated.");
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
