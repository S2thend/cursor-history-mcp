/**
 * cursor_history_restore tool - Restore chat history from backup
 *
 * ⚠️ DESTRUCTIVE OPERATION: This tool overwrites current chat history
 */

import { restoreBackup } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";

/**
 * Input schema for the restore tool
 */
const RestoreInputSchema = z.object({
  backupPath: z.string(),
  force: z.boolean().default(false).optional(),
});

/**
 * Tool definition for MCP
 */
export const restoreTool = {
  name: "cursor_history_restore",
  description:
    "⚠️ DESTRUCTIVE: Restore Composer databases from a backup archive. This can overwrite Composer history; it does not restore Store databases, Agent transcripts or ACP stores. Back up current Composer data first.",
  inputSchema: {
    type: "object" as const,
    properties: {
      backupPath: {
        type: "string",
        description: "Path to the backup file to restore from",
      },
      force: {
        type: "boolean",
        description:
          "Allow overwriting existing backup targets (default: false). The server has no interactive confirmation; obtain approval in the client.",
        default: false,
      },
    },
    required: ["backupPath"],
    additionalProperties: false,
  },
};

/**
 * Handler for the restore tool
 */
export async function handleRestore(
  args: Record<string, unknown>
): Promise<string> {
  try {
    const parsed = RestoreInputSchema.parse(args);

    const result = await restoreBackup({
      backupPath: parsed.backupPath,
      force: parsed.force ?? false,
    });

    const lines: string[] = [
      "Restore completed successfully!",
      "",
      `📁 Restored from: ${parsed.backupPath}`,
      `📄 Files restored: ${result.filesRestored}`,
      `📍 Target path: ${result.targetPath}`,
      "",
      "⚠️ Note: Restart Cursor IDE to see the restored sessions.",
    ];

    if (result.warnings.length > 0) {
      lines.push("", "⚠️ Warnings:");
      for (const warning of result.warnings) {
        lines.push(`  • ${warning}`);
      }
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
