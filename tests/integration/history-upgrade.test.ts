import { beforeEach, describe, expect, it, vi } from "vitest";
import * as history from "cursor-history";
import { handleListSessions } from "../../src/tools/list-sessions.js";
import { handleShowSession } from "../../src/tools/show-session.js";
import { handleSearch } from "../../src/tools/search.js";
import { handleExport } from "../../src/tools/export.js";
import { handleMigrate } from "../../src/tools/migrate.js";

vi.mock("cursor-history", async (importOriginal) => ({
  ...await importOriginal<typeof import("cursor-history")>(),
  listSessions: vi.fn(), getSession: vi.fn(), searchSessions: vi.fn(),
  exportSessionToJson: vi.fn(), exportSessionToMarkdown: vi.fn(), migrateSession: vi.fn(),
}));

const id = "ABCDEFAB-0000-0000-0000-000000000001";
const session: history.Session = {
  id, workspace: "/work/project", timestamp: "2025-01-01T00:00:00Z", messageCount: 1,
  index: 4, indexScope: "workspace", indexWorkspacePath: "/work/project",
  source: "workspace-fallback", resolvedSource: "store-transcript", resolutionState: "partial",
  messages: [{ role: "user", content: "authentication question", timestamp: "2025-01-01T00:00:00Z", timestampSource: "session-fallback" }],
};

beforeEach(() => vi.resetAllMocks());

describe("cursor-history 0.18 adapter", () => {
  it("lists native IDs, scoped indices and partial-source state", async () => {
    vi.mocked(history.listSessions).mockResolvedValue({ data: [session], pagination: { total: 1, limit: 20, offset: 0, hasMore: false } });
    const result = await handleListSessions({ workspace: "/work/project" });
    expect(result).toContain("#5");
    expect(result).toContain(id);
    expect(result).toContain("Data: partial");
    expect(result).toContain("Index scope: workspace");
  });

  it("keeps exact UUID spelling and the workspace boundary when reading", async () => {
    vi.mocked(history.getSession).mockResolvedValue(session);
    const result = await handleShowSession({ sessionId: id, workspace: "/work/project" });
    expect(history.getSession).toHaveBeenCalledWith(id, { workspace: "/work/project", includeCrossWorkspaceSources: false });
    expect(result).toContain("Partial history");
    expect(result).toContain("≈");
    expect(result).toContain("[session-fallback]");
  });

  it("converts only read indices to zero-based and forwards explicit cross-workspace opt-in", async () => {
    vi.mocked(history.getSession).mockResolvedValue(session);
    await handleShowSession({ sessionIndex: 1, workspace: "/work/project", includeCrossWorkspaceSources: true });
    expect(history.getSession).toHaveBeenCalledWith(0, { workspace: "/work/project", includeCrossWorkspaceSources: true });
  });

  it.each([{}, { sessionIndex: 1, sessionId: id }])("rejects missing or conflicting selectors before reading: %j", async (args) => {
    await expect(handleShowSession(args)).rejects.toThrow("exactly one");
    expect(history.getSession).not.toHaveBeenCalled();
  });

  it("returns one JSON encoding, retaining provenance", async () => {
    vi.mocked(history.exportSessionToJson).mockResolvedValue(JSON.stringify(session));
    const result = await handleExport({ sessionId: id, workspace: "/work/project", format: "json" });
    expect(JSON.parse(result)).toMatchObject({ id, resolvedSource: "store-transcript" });
    expect(history.exportSessionToJson).toHaveBeenCalledWith(id, { workspace: "/work/project", includeCrossWorkspaceSources: false });
  });

  it("keeps Markdown export scoped", async () => {
    vi.mocked(history.exportSessionToMarkdown).mockResolvedValue("# Conversation");
    expect(await handleExport({ sessionIndex: 2, workspace: "/work/project" })).toBe("# Conversation");
    expect(history.exportSessionToMarkdown).toHaveBeenCalledWith(1, { workspace: "/work/project", includeCrossWorkspaceSources: false });
  });

  it("returns reusable search IDs and corrected message coordinates", async () => {
    vi.mocked(history.searchSessions).mockResolvedValue([{ session, match: "authentication question", messageIndex: 0, offset: 0, contextBefore: ["before match"], contextAfter: ["after match"] }] as history.SearchResult[]);
    const result = await handleSearch({ query: "authentication", workspace: "/work/project", context: 2 });
    expect(history.searchSessions).toHaveBeenCalledWith("authentication", expect.objectContaining({ workspace: "/work/project", context: 2, includeCrossWorkspaceSources: false }));
    expect(result).toContain(id);
    expect(result).toContain("Message index: 0 · UTF-16 offset: 0");
    expect(result).toContain("before match");
    expect(result).toContain("after match");
  });

  it("passes one-based migration indices unchanged and previews without writes", async () => {
    vi.mocked(history.migrateSession).mockResolvedValue([{ success: true }] as history.SessionMigrationResult[]);
    const result = await handleMigrate({ sessionIndexes: [1, 3], destination: "/work/new", workspace: "/work/project", dryRun: true });
    expect(history.migrateSession).toHaveBeenCalledWith({ sessions: [1, 3], destination: "/work/new", workspace: "/work/project", mode: "move", dryRun: true });
    expect(result).toContain("Preview:");
  });

  it("migrates by exact UUID without positional conversion", async () => {
    vi.mocked(history.migrateSession).mockResolvedValue([]);
    await handleMigrate({ sessionIds: [id], destination: "/work/new", mode: "copy" });
    expect(history.migrateSession).toHaveBeenCalledWith(expect.objectContaining({ sessions: [id], mode: "copy", dryRun: false }));
  });

  it("preserves typed rejection for Store-only migration", async () => {
    vi.mocked(history.migrateSession).mockRejectedValue(new history.UnsupportedSessionMigrationError(id, "store-only"));
    await expect(handleMigrate({ sessionIds: [id], destination: "/work/new" })).rejects.toThrow("UNSUPPORTED_SESSION_MIGRATION");
  });
});
