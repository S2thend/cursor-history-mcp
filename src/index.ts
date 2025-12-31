#!/usr/bin/env node
/**
 * cursor-history-mcp: MCP server for Cursor AI chat history
 *
 * This server exposes cursor-history library functions as MCP tools,
 * allowing MCP clients like Claude Code to browse, search, and manage
 * Cursor AI chat history.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { listSessionsTool, handleListSessions } from "./tools/list-sessions.js";
import { showSessionTool, handleShowSession } from "./tools/show-session.js";
import { searchTool, handleSearch } from "./tools/search.js";
import { exportTool, handleExport } from "./tools/export.js";
import { backupTool, handleBackup } from "./tools/backup.js";
import { restoreTool, handleRestore } from "./tools/restore.js";
import { migrateTool, handleMigrate } from "./tools/migrate.js";

/**
 * All available tools
 */
const TOOLS = [
  listSessionsTool,
  showSessionTool,
  searchTool,
  exportTool,
  backupTool,
  restoreTool,
  migrateTool,
];

/**
 * Tool handler dispatch map
 */
const TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>) => Promise<unknown>
> = {
  cursor_history_list: handleListSessions,
  cursor_history_show: handleShowSession,
  cursor_history_search: handleSearch,
  cursor_history_export: handleExport,
  cursor_history_backup: handleBackup,
  cursor_history_restore: handleRestore,
  cursor_history_migrate: handleMigrate,
};

/**
 * Creates and configures the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: "cursor-history-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await handler(args ?? {});
      return {
        content: [
          {
            type: "text",
            text:
              typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
