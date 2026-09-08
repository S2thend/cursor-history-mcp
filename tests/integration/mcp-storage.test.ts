import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

// Synthetic databases only. Never point this test at a real Cursor data tree.
const ids = {
  composer: "aaaaaaaa-0000-0000-0000-000000000001",
  store: "bbbbbbbb-0000-0000-0000-000000000002",
  acp: "cccccccc-0000-0000-0000-000000000003",
  transcript: "dddddddd-0000-0000-0000-000000000004",
};
const createdAt = Date.UTC(2025, 5, 1);
const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
let root: string;
let project: string;
let storeDb: string;
let client: Client;
let transport: StdioClientTransport;

async function database(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  let Database;
  try {
    Database = createRequire(import.meta.url)("node:sqlite").DatabaseSync;
  } catch {
    Database = createRequire(import.meta.url)("better-sqlite3");
  }
  return new Database(path);
}

async function writeStore(path: string, id: string, content: string) {
  const db = await database(path);
  try {
    db.exec("CREATE TABLE blobs (id TEXT PRIMARY KEY, data BLOB); CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT)");
    const leaf = Buffer.from(JSON.stringify({ role: "user", content }));
    const leafHash = sha(leaf);
    const branch = Buffer.concat([Buffer.from([0x0a, 0x20]), Buffer.from(leafHash, "hex")]);
    const insert = db.prepare("INSERT INTO blobs (id, data) VALUES (?, ?)");
    insert.run(leafHash, leaf);
    insert.run(sha(branch), branch);
    db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").run("0", Buffer.from(JSON.stringify({ agentId: id, latestRootBlobId: sha(branch), createdAt, name: "Synthetic MCP session" })).toString("hex"));
  } finally { db.close(); }
  writeFileSync(join(dirname(path), "meta.json"), JSON.stringify({ cwd: project, hasConversation: true, createdAtMs: createdAt, updatedAtMs: createdAt }));
}

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  return { error: result.isError, text: result.content.map(item => item.type === "text" ? item.text : "").join("\n") };
}

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), "mcp-history-storage-"));
  project = join(root, "project");
  mkdirSync(project);
  const workspace = join(root, "User", "workspaceStorage", "workspace-a");
  const db = await database(join(workspace, "state.vscdb"));
  db.exec("CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  db.prepare("INSERT INTO ItemTable (key, value) VALUES (?, ?)").run("composer.composerData", JSON.stringify({ allComposers: [{ composerId: ids.composer, name: "Composer test", createdAt, lastUpdatedAt: createdAt }] }));
  db.close();
  writeFileSync(join(workspace, "workspace.json"), JSON.stringify({ folder: pathToFileURL(project).href }));
  const global = await database(join(root, "User", "globalStorage", "state.vscdb"));
  global.exec("CREATE TABLE cursorDiskKV (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  global.prepare("INSERT INTO cursorDiskKV (key, value) VALUES (?, ?)").run(`composerData:${ids.composer}`, JSON.stringify({ name: "Composer test", createdAt, workspaceIdentifier: { uri: { fsPath: project } }, fullConversationHeadersOnly: [{ bubbleId: "msg-1", type: 1 }] }));
  global.prepare("INSERT INTO cursorDiskKV (key, value) VALUES (?, ?)").run(`bubbleId:${ids.composer}:msg-1`, JSON.stringify({ bubbleId: "msg-1", type: 1, text: "Composer authentication question", createdAt }));
  global.close();
  const hash = createHash("md5").update(project).digest("hex");
  storeDb = join(root, "store", "chats", hash, ids.store, "store.db");
  await writeStore(storeDb, ids.store, "Store authentication question");
  await writeStore(join(root, "store", "acp-sessions", ids.acp, "store.db"), ids.acp, "ACP authentication question");
  const transcript = join(root, "store", "projects", "synthetic", "agent-transcripts", ids.transcript, `${ids.transcript}.jsonl`);
  mkdirSync(dirname(transcript), { recursive: true });
  writeFileSync(transcript, JSON.stringify({ role: "user", message: { content: [{ type: "text", text: "Transcript authentication question" }] } }) + "\n");

  transport = new StdioClientTransport({
    command: process.execPath,
    args: [process.env.MCP_TEST_ENTRY ?? resolve("dist/index.cjs")],
    env: { ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)), CURSOR_DATA_PATH: join(root, "User", "workspaceStorage"), CURSOR_STORE_ROOT: join(root, "store") },
    stderr: "pipe",
  });
  client = new Client({ name: "history-upgrade-test", version: "1.0.0" }, { capabilities: {} });
  let stderr = "";
  try {
    const connection = client.connect(transport);
    transport.stderr?.on("data", chunk => { stderr += chunk.toString(); });
    await connection;
  } catch (error) {
    throw new Error(`MCP startup failed: ${String(error)}\n${stderr}`);
  }
}, 15000);

afterAll(async () => {
  await client?.close();
  await transport?.close();
  if (root) rmSync(root, { recursive: true, force: true });
});

describe("built MCP server with real cursor-history storage", () => {
  it("starts with package version and registers all eight tools", async () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(client.getServerVersion()?.version).toBe(pkg.version);
    expect((await client.listTools()).tools).toHaveLength(8);
  });

  it("discovers Composer, Store DB, ACP and transcript history", async () => {
    const result = await call("cursor_history_list", { limit: 100 });
    expect(result.error).not.toBe(true);
    for (const id of Object.values(ids)) expect(result.text).toContain(id);
    const searched = await call("cursor_history_search", { query: "authentication", context: 2 });
    expect(searched.error).not.toBe(true);
    for (const id of Object.values(ids)) expect(searched.text).toContain(id);
  });

  it("reads and exports Store / ACP content as an object with provenance", async () => {
    for (const [key, id] of Object.entries(ids)) {
      const shown = await call("cursor_history_show", { sessionId: id });
      expect(shown.error, shown.text).not.toBe(true);
      expect(shown.text).toContain("authentication question");
      const exported = await call("cursor_history_export", { sessionId: id, format: "json" });
      expect(exported.error, exported.text).not.toBe(true);
      const data = JSON.parse(exported.text);
      expect(data.id).toBe(id);
      if (key !== "composer") expect(data.resolvedSource).toMatch(/^store-/);
    }
  });

  it("preserves workspace scope and refuses Store migration without changing the DB", async () => {
    const listed = await call("cursor_history_list", { workspace: project });
    expect(listed.text).toContain(ids.store);
    const before = sha(readFileSync(storeDb));
    const rejected = await call("cursor_history_migrate", { sessionIds: [ids.store], destination: join(root, "destination"), workspace: project, dryRun: true });
    expect(rejected.error).toBe(true);
    expect(rejected.text).toContain("UNSUPPORTED_SESSION_MIGRATION");
    expect(sha(readFileSync(storeDb))).toBe(before);
  });

  it("backs up and restores only the synthetic Composer tree", async () => {
    const backupPath = join(root, "history.zip");
    const backed = await call("cursor_history_backup", { outputPath: backupPath });
    expect(backed.error, backed.text).not.toBe(true);
    const restored = await call("cursor_history_restore", { backupPath, force: true });
    expect(restored.error, restored.text).not.toBe(true);
    expect(restored.text).toContain("Restore completed successfully");
  });
});
