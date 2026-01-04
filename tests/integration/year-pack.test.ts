/**
 * Integration tests for year-pack tool
 * Tests the complete tool handler with mocked cursor-history APIs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as cursorHistory from "cursor-history";

// Mock cursor-history module
vi.mock("cursor-history", () => ({
  listSessions: vi.fn(),
  getSession: vi.fn(),
}));

const mockListSessions = vi.mocked(cursorHistory.listSessions);
const mockGetSession = vi.mocked(cursorHistory.getSession);

// Dynamic import to ensure mocks are in place
async function getHandleYearPack() {
  const module = await import("../../src/tools/year-pack/index.js");
  return module.handleYearPack;
}

describe("year-pack integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  // ============================================================================
  // T030: Integration test for full year-pack generation
  // ============================================================================

  describe("T030: full year-pack generation", () => {
    it("should generate valid year-pack for a year with sessions", async () => {
      const year = 2025;
      const now = new Date(year, 6, 15); // July 15, 2025

      // Mock session list
      mockListSessions.mockResolvedValue({
        data: [
          { id: "session-1", timestamp: new Date(year, 0, 15).toISOString() },
          { id: "session-2", timestamp: new Date(year, 3, 20).toISOString() },
          { id: "session-3", timestamp: new Date(year, 8, 10).toISOString() },
        ],
        pagination: { hasMore: false, total: 3, offset: 0, limit: 100 },
      });

      // Mock full sessions with user messages
      mockGetSession
        .mockResolvedValueOnce({
          workspace: "/projects/app",
          timestamp: new Date(year, 0, 15).toISOString(),
          messages: [
            {
              role: "user",
              content: "How do I implement authentication in React?",
              timestamp: new Date(year, 0, 15, 10, 0).toISOString(),
            },
            {
              role: "assistant",
              content: "You can use libraries like Auth0 or Firebase...",
              timestamp: new Date(year, 0, 15, 10, 1).toISOString(),
            },
            {
              role: "user",
              content: "What about JWT tokens for API authentication?",
              timestamp: new Date(year, 0, 15, 10, 5).toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({
          workspace: "/projects/app",
          timestamp: new Date(year, 3, 20).toISOString(),
          messages: [
            {
              role: "user",
              content: "How to optimize React component performance?",
              timestamp: new Date(year, 3, 20, 14, 0).toISOString(),
            },
            {
              role: "user",
              content: "What is useMemo and when should I use it?",
              timestamp: new Date(year, 3, 20, 14, 10).toISOString(),
            },
          ],
        })
        .mockResolvedValueOnce({
          workspace: "/projects/backend",
          timestamp: new Date(year, 8, 10).toISOString(),
          messages: [
            {
              role: "user",
              content: "How to set up a Node.js Express server?",
              timestamp: new Date(year, 8, 10, 9, 0).toISOString(),
            },
            {
              role: "user",
              content: "What middleware should I use for logging?",
              timestamp: new Date(year, 8, 10, 9, 15).toISOString(),
            },
          ],
        });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year });

      // Verify output structure
      expect(result).toContain("# Year Pack Generated Successfully");
      expect(result).toContain(`**Year**: ${year}`);
      expect(result).toContain("**Language**: en");
      expect(result).toContain("**Sessions Analyzed**: 3");

      // Verify JSON is included
      expect(result).toContain("## Year Pack JSON");
      expect(result).toContain('"meta"');
      expect(result).toContain('"stats"');
      expect(result).toContain('"keywords"');
      expect(result).toContain('"samples"');
      expect(result).toContain('"safety"');

      // Verify prompt template is included
      expect(result).toContain("## Prompt Template");
      expect(result).toContain("Year in Review Report Generator");
    });

    it("should handle no sessions found for year", async () => {
      mockListSessions.mockResolvedValue({
        data: [],
        pagination: { hasMore: false, total: 0, offset: 0, limit: 100 },
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2020 });

      expect(result).toContain("No chat sessions found for year 2020");
    });

    it("should handle sessions with no user questions", async () => {
      mockListSessions.mockResolvedValue({
        data: [{ id: "session-1", timestamp: new Date(2025, 5, 1).toISOString() }],
        pagination: { hasMore: false, total: 1, offset: 0, limit: 100 },
      });

      mockGetSession.mockResolvedValueOnce({
        workspace: "/projects/test",
        timestamp: new Date(2025, 5, 1).toISOString(),
        messages: [
          {
            role: "assistant",
            content: "I can help you with that...",
            timestamp: new Date(2025, 5, 1, 10, 0).toISOString(),
          },
        ],
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2025 });

      expect(result).toContain("Found 1 session(s) for year 2025");
      expect(result).toContain("no user questions were extracted");
    });

    it("should use default year when not specified", async () => {
      const currentYear = new Date().getFullYear();

      mockListSessions.mockResolvedValue({
        data: [],
        pagination: { hasMore: false, total: 0, offset: 0, limit: 100 },
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({});

      expect(result).toContain(`No chat sessions found for year ${currentYear}`);
    });
  });

  // ============================================================================
  // T034: Test workspace filtering
  // ============================================================================

  describe("T034: workspace filtering", () => {
    it("should filter sessions by workspace when specified", async () => {
      const year = 2025;
      const workspace = "/projects/my-app";

      mockListSessions.mockResolvedValue({
        data: [{ id: "session-1", timestamp: new Date(year, 3, 10).toISOString() }],
        pagination: { hasMore: false, total: 1, offset: 0, limit: 100 },
      });

      mockGetSession.mockResolvedValueOnce({
        workspace,
        timestamp: new Date(year, 3, 10).toISOString(),
        messages: [
          {
            role: "user",
            content: "How do I configure TypeScript in this project?",
            timestamp: new Date(year, 3, 10, 10, 0).toISOString(),
          },
        ],
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year, workspace });

      // Verify listSessions was called with workspace filter
      expect(mockListSessions).toHaveBeenCalledWith(
        expect.objectContaining({ workspace })
      );

      // Verify output includes workspace info
      expect(result).toContain("# Year Pack Generated Successfully");
    });

    it("should return helpful message when no sessions match workspace", async () => {
      const workspace = "/projects/nonexistent";

      mockListSessions.mockResolvedValue({
        data: [],
        pagination: { hasMore: false, total: 0, offset: 0, limit: 100 },
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2025, workspace });

      expect(result).toContain("No chat sessions found for year 2025");
      expect(result).toContain(`in workspace "${workspace}"`);
    });

    it("should include workspace in year-pack meta output", async () => {
      const year = 2025;
      const workspace = "/projects/special";

      mockListSessions.mockResolvedValue({
        data: [{ id: "s1", timestamp: new Date(year, 5, 15).toISOString() }],
        pagination: { hasMore: false, total: 1, offset: 0, limit: 100 },
      });

      mockGetSession.mockResolvedValueOnce({
        workspace,
        timestamp: new Date(year, 5, 15).toISOString(),
        messages: [
          {
            role: "user",
            content: "What is the best way to structure a React application?",
            timestamp: new Date(year, 5, 15, 14, 30).toISOString(),
          },
        ],
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year, workspace });

      // Parse the JSON from the output
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      expect(jsonMatch).toBeTruthy();

      const yearPackJson = JSON.parse(jsonMatch![1]);
      expect(yearPackJson.meta.workspace).toBe(workspace);
    });
  });

  // ============================================================================
  // T038: Test language selection
  // ============================================================================

  describe("T038: language selection", () => {
    beforeEach(() => {
      const year = 2025;

      mockListSessions.mockResolvedValue({
        data: [{ id: "s1", timestamp: new Date(year, 6, 1).toISOString() }],
        pagination: { hasMore: false, total: 1, offset: 0, limit: 100 },
      });

      mockGetSession.mockResolvedValueOnce({
        workspace: "/projects/test",
        timestamp: new Date(year, 6, 1).toISOString(),
        messages: [
          {
            role: "user",
            content: "How do I implement a REST API with authentication?",
            timestamp: new Date(year, 6, 1, 10, 0).toISOString(),
          },
        ],
      });
    });

    it("should generate English prompt template by default", async () => {
      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2025 });

      expect(result).toContain("**Language**: en");
      expect(result).toContain("Year in Review Report Generator");
      expect(result).toContain("Important Guidelines");
      expect(result).toContain("Report Sections");
    });

    it("should generate English prompt template when language=en", async () => {
      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2025, language: "en" });

      expect(result).toContain("**Language**: en");
      expect(result).toContain("Year in Review Report Generator");
      expect(result).toContain("Fun, insightful, celebratory");
    });

    it("should generate Chinese prompt template when language=zh", async () => {
      // Reset mock for Chinese test
      vi.clearAllMocks();

      mockListSessions.mockResolvedValue({
        data: [{ id: "s1", timestamp: new Date(2025, 6, 1).toISOString() }],
        pagination: { hasMore: false, total: 1, offset: 0, limit: 100 },
      });

      mockGetSession.mockResolvedValueOnce({
        workspace: "/projects/test",
        timestamp: new Date(2025, 6, 1).toISOString(),
        messages: [
          {
            role: "user",
            content: "如何实现用户认证功能？",
            timestamp: new Date(2025, 6, 1, 10, 0).toISOString(),
          },
        ],
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2025, language: "zh" });

      expect(result).toContain("**Language**: zh");
      expect(result).toContain("年度回顾报告生成器");
      expect(result).toContain("重要指南");
      expect(result).toContain("报告章节");
    });

    it("should include language in year-pack meta", async () => {
      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2025, language: "zh" });

      // Parse the JSON from the output
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      expect(jsonMatch).toBeTruthy();

      const yearPackJson = JSON.parse(jsonMatch![1]);
      expect(yearPackJson.meta.language).toBe("zh");
    });
  });

  // ============================================================================
  // Additional integration tests
  // ============================================================================

  describe("pagination handling", () => {
    it("should handle multiple pages of sessions", async () => {
      const year = 2025;

      // First page
      mockListSessions
        .mockResolvedValueOnce({
          data: [
            { id: "s1", timestamp: new Date(year, 0, 1).toISOString() },
            { id: "s2", timestamp: new Date(year, 0, 2).toISOString() },
          ],
          pagination: { hasMore: true, total: 4, offset: 0, limit: 100 },
        })
        // Second page
        .mockResolvedValueOnce({
          data: [
            { id: "s3", timestamp: new Date(year, 0, 3).toISOString() },
            { id: "s4", timestamp: new Date(year, 0, 4).toISOString() },
          ],
          pagination: { hasMore: false, total: 4, offset: 100, limit: 100 },
        });

      // Mock getSession for each session
      for (let i = 1; i <= 4; i++) {
        mockGetSession.mockResolvedValueOnce({
          workspace: "/projects/test",
          timestamp: new Date(year, 0, i).toISOString(),
          messages: [
            {
              role: "user",
              content: `Question number ${i} about programming`,
              timestamp: new Date(year, 0, i, 10, 0).toISOString(),
            },
          ],
        });
      }

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year });

      // Verify pagination was handled
      expect(mockListSessions).toHaveBeenCalledTimes(2);
      expect(result).toContain("**Sessions Analyzed**: 4");
    });
  });

  describe("graceful degradation", () => {
    it("should skip topics when fewer than 50 questions", async () => {
      const year = 2025;

      mockListSessions.mockResolvedValue({
        data: [{ id: "s1", timestamp: new Date(year, 5, 1).toISOString() }],
        pagination: { hasMore: false, total: 1, offset: 0, limit: 100 },
      });

      mockGetSession.mockResolvedValueOnce({
        workspace: "/projects/test",
        timestamp: new Date(year, 5, 1).toISOString(),
        messages: [
          {
            role: "user",
            content: "How do I use TypeScript generics effectively?",
            timestamp: new Date(year, 5, 1, 10, 0).toISOString(),
          },
        ],
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year });

      expect(result).toContain("**Topics Extracted**: 0");

      // Parse the JSON and verify topics are empty
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      expect(jsonMatch).toBeTruthy();

      const yearPackJson = JSON.parse(jsonMatch![1]);
      expect(yearPackJson.topics).toEqual([]);
      expect(yearPackJson.notes).toContainEqual(
        expect.stringContaining("Topic extraction skipped")
      );
    });
  });

  describe("input validation", () => {
    it("should reject invalid year", async () => {
      const handleYearPack = await getHandleYearPack();

      await expect(handleYearPack({ year: 1900 })).rejects.toThrow();
    });

    it("should reject invalid language", async () => {
      const handleYearPack = await getHandleYearPack();

      await expect(handleYearPack({ year: 2025, language: "fr" })).rejects.toThrow();
    });

    it("should accept valid maxSamples parameter", async () => {
      mockListSessions.mockResolvedValue({
        data: [{ id: "s1", timestamp: new Date(2025, 5, 1).toISOString() }],
        pagination: { hasMore: false, total: 1, offset: 0, limit: 100 },
      });

      mockGetSession.mockResolvedValueOnce({
        workspace: "/projects/test",
        timestamp: new Date(2025, 5, 1).toISOString(),
        messages: [
          {
            role: "user",
            content: "What is the best testing framework for React?",
            timestamp: new Date(2025, 5, 1, 10, 0).toISOString(),
          },
        ],
      });

      const handleYearPack = await getHandleYearPack();
      const result = await handleYearPack({ year: 2025, maxSamples: 10 });

      expect(result).toContain("# Year Pack Generated Successfully");
    });
  });
});
