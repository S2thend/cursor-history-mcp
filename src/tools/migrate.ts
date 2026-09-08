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
  sessionIndexes: z.array(z.number().int().min(1)).min(1).optional(),
  sessionIds: z.array(z.string().min(1)).min(1).optional(),
  destination: z.string(),
  mode: z.enum(["move", "copy"]).default("move").optional(),
  workspace: z.string().min(1).optional(),
  dryRun: z.boolean().optional(),
}).refine(value => (value.sessionIndexes !== undefined) !== (value.sessionIds !== undefined),
  "Provide exactly one of sessionIndexes or sessionIds");

/**
 * Tool definition for MCP
 */
export const migrateTool = {
  name: "cursor_history_migrate",
  description:
    "Move or copy eligible Composer sessions between workspaces. Store-only, merged-source and ambiguous sessions are refused. Use dryRun to preview. Moving removes the original; back up first.",
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionIds: {
        type: "array",
        items: { type: "string", minLength: 1 },
        minItems: 1,
        description: "Exact native UUIDs from list/search. Use instead of sessionIndexes for stable selection.",
      },
      workspace: {
        type: "string",
        description: "Source workspace scope; use the same scope that produced the session indexes.",
      },
      dryRun: {
        type: "boolean",
        description: "Preview without changing history (default: false).",
        default: false,
      },
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
    required: ["destination"],
    oneOf: [
      { required: ["sessionIndexes"], not: { required: ["sessionIds"] } },
      { required: ["sessionIds"], not: { required: ["sessionIndexes"] } },
    ],
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
    const sessions = parsed.sessionIds ?? parsed.sessionIndexes;
    if (!sessions) throw new Error("Provide sessionIds or sessionIndexes");

    // v0.18 migration selectors are one-based (unlike public read indices).
    const results = await migrateSession({
      sessions,
      destination: parsed.destination,
      mode: mode,
      workspace: parsed.workspace,
      dryRun: parsed.dryRun ?? false,
    });

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    const errors = results.filter((r) => !r.success).map((r) => r.error ?? "Unknown error");

    const modeLabel = mode === "copy" ? "copied" : "moved";
    const lines: string[] = [];

    if (successCount > 0) {
      lines.push(
        `${parsed.dryRun ? "Preview: would have" : "Successfully"} ${modeLabel} ${successCount} session(s) to:`,
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
