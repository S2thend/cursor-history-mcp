/**
 * cursor_history_backup tool - Create backup of all chat history
 */

import { createBackup } from "cursor-history";
import { z } from "zod";
import { mapCursorHistoryError, isMcpError } from "../errors.js";

/**
 * Input schema for the backup tool
 */
const BackupInputSchema = z.object({
  outputPath: z.string().optional(),
  force: z.boolean().default(false).optional(),
});

/**
 * Tool definition for MCP
 */
export const backupTool = {
  name: "cursor_history_backup",
  description:
    "Create a backup of all Cursor AI chat history. Saves a portable archive that can be restored later.",
  inputSchema: {
    type: "object" as const,
    properties: {
      outputPath: {
        type: "string",
        description:
          "Path where the backup file should be saved. If not specified, saves to ~/cursor-history-backups/ with a timestamp.",
      },
      force: {
        type: "boolean",
        description: "Overwrite existing backup file if it exists (default: false)",
        default: false,
      },
    },
    additionalProperties: false,
  },
};

/**
 * Handler for the backup tool
 */
export async function handleBackup(
  args: Record<string, unknown>
): Promise<string> {
  try {
    const parsed = BackupInputSchema.parse(args);

    const result = await createBackup({
      outputPath: parsed.outputPath,
      force: parsed.force ?? false,
    });

    const stats = result.manifest.stats;
    const lines: string[] = [
      "Backup created successfully!",
      "",
      `📁 Path: ${result.backupPath}`,
      `📊 Sessions: ${stats.sessionCount}`,
      `🗂️  Workspaces: ${stats.workspaceCount}`,
      `📦 Size: ${formatBytes(stats.totalSize)}`,
    ];

    return lines.join("\n");
  } catch (error) {
    const mcpError = mapCursorHistoryError(error);
    if (isMcpError(mcpError)) {
      throw new Error(mcpError.message);
    }
    throw error;
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeIndex = Math.min(i, sizes.length - 1);
  const sizeLabel = sizes[sizeIndex];
  return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + " " + (sizeLabel ?? "Bytes");
}
