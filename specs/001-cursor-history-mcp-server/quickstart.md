# Quickstart: cursor-history-mcp

Get up and running with the Cursor History MCP server in under 5 minutes.

## Prerequisites

- Node.js 20 or higher
- Cursor IDE installed (with existing chat history)
- An MCP-compatible client (Claude Code, Claude Desktop, etc.)

## Installation

No installation required! The server runs via npx.

## Configure Your MCP Client

### Claude Code

Add to your Claude Code MCP settings (`~/.claude/claude_desktop_config.json` or via settings UI):

```json
{
  "mcpServers": {
    "cursor-history": {
      "command": "npx",
      "args": ["-y", "cursor-history-mcp"]
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "cursor-history": {
      "command": "npx",
      "args": ["-y", "cursor-history-mcp"]
    }
  }
}
```

## Verify Installation

After configuring, restart your MCP client and ask:

> "List my Cursor chat sessions"

You should see a list of your recent Cursor AI conversations.

## Available Commands

Once configured, you can ask your AI assistant to:

| Request | What It Does |
|---------|-------------|
| "List my Cursor chats" | Shows recent chat sessions |
| "Show session #3" | Displays full conversation |
| "Search for 'authentication'" | Finds matching conversations |
| "Export session #1 as markdown" | Gets conversation in markdown |
| "Backup my Cursor history" | Creates a backup archive |

## Example Conversation

```
You: Show my recent Cursor chat sessions

Claude: Here are your 5 most recent Cursor chat sessions:

#1 - cursor-history-mcp (12/31 09:15 AM)
    15 messages · "Help me create an MCP server..."

#2 - my-react-app (12/30 03:22 PM)
    8 messages · "Add authentication to the app..."

#3 - api-server (12/29 11:30 AM)
    23 messages · "Create REST endpoints for users..."

You: Search for "database migration"

Claude: Found 2 matches:

Session #3 (api-server):
  "...help me write the database migration script..."

Session #5 (backend-service):
  "...migration failed with error on column type..."
```

## Troubleshooting

### "Cursor data not found"

Ensure Cursor IDE is installed and you have opened it at least once to create chat history.

### "Database is locked"

Close Cursor IDE before running write operations (backup, restore, migrate). Read operations
(list, show, search, export) usually work even when Cursor is running.

### "Session not found"

Session indexes may change as new sessions are created. Use `cursor_history_list` to get
current indexes before referencing a specific session.

## What's Next

- **Backup regularly**: Use `cursor_history_backup` before major operations
- **Export important chats**: Save valuable conversations as markdown
- **Migrate after renaming**: If you rename a project folder, migrate sessions to the new path
