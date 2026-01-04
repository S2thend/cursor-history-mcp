/**
 * cursor_history_year_pack MCP tool
 * Generates annual report data package from chat history
 */

import { listSessions, getSession } from "cursor-history";
import { mapCursorHistoryError, isMcpError } from "../../errors.js";
import {
  YearPackInputSchema,
  type YearPackInput,
  type YearPack,
  type YearPackMeta,
  type YearPackResponse,
  type ProcessedQuestion,
  SAFETY_GUARANTEES,
  DEFAULT_CONFIG,
} from "./types.js";
import { getAppliedFilters } from "./sanitizer.js";
import {
  processQuestion,
  calculateStats,
  extractKeywords,
  selectSafeSamples,
} from "./analyzer.js";
import { extractTopics, shouldSkipTopics } from "./topics.js";
import { generatePromptTemplate } from "./prompt.js";

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * MCP tool definition for year-pack generator
 */
export const yearPackTool = {
  name: "cursor_history_year_pack",
  description:
    "Generate a year-in-review data package from Cursor AI chat history. " +
    "Produces a sanitized JSON summary with statistics, topics, and keywords, " +
    "plus a prompt template for LLM-based report generation. Read-only operation.",
  inputSchema: {
    type: "object" as const,
    properties: {
      year: {
        type: "integer",
        description: `Calendar year to analyze (default: current year)`,
        minimum: 1970,
        maximum: new Date().getFullYear(),
      },
      language: {
        type: "string",
        description: "Report language preference (default: en)",
        enum: ["en", "zh"],
      },
      workspace: {
        type: "string",
        description: "Optional workspace path to filter sessions",
      },
      maxSamples: {
        type: "integer",
        description: "Maximum sample questions to include (default: 30)",
        minimum: 0,
        maximum: 100,
      },
      maxSampleLength: {
        type: "integer",
        description: "Maximum characters per sample (default: 120)",
        minimum: 50,
        maximum: 500,
      },
      topicsCount: {
        type: "integer",
        description: "Number of topics to extract (default: 7)",
        minimum: 3,
        maximum: 15,
      },
    },
    additionalProperties: false,
  },
};

// ============================================================================
// Session Fetching
// ============================================================================

interface SessionMessage {
  role: string;
  content: string;
  timestamp?: Date | string | number;
}

interface SessionData {
  workspace?: string;
  timestamp?: Date | string | number;
  messages?: SessionMessage[];
}

/**
 * Fetch all sessions for a given year with optional workspace filter
 */
async function fetchSessionsForYear(
  year: number,
  workspace?: string
): Promise<{ sessions: SessionData[]; sessionCount: number }> {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const sessions: SessionData[] = [];

  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const result = await listSessions({ limit, offset, workspace });
    const batch = result.data;

    for (let i = 0; i < batch.length; i++) {
      const session = batch[i];
      if (!session) continue;

      // Check if session is within the year
      const sessionDate = new Date(session.timestamp);
      if (sessionDate >= yearStart && sessionDate < yearEnd) {
        // Fetch full session content using 0-based index
        const sessionIndex = offset + i;
        const fullSession = await getSession(sessionIndex);
        sessions.push(fullSession as unknown as SessionData);
      }
    }

    hasMore = result.pagination.hasMore;
    offset += limit;

    // Safety limit to prevent infinite loops
    if (offset > 100000) break;
  }

  return { sessions, sessionCount: sessions.length };
}

/**
 * Extract user questions from sessions
 */
function extractUserQuestions(
  sessions: SessionData[],
  year: number,
  maxLength: number
): ProcessedQuestion[] {
  const questions: ProcessedQuestion[] = [];

  for (const session of sessions) {
    const messages = session.messages ?? [];

    for (const msg of messages) {
      // Only process user messages
      if (msg.role !== "user") continue;
      if (!msg.content || msg.content.trim().length === 0) continue;

      // Parse timestamp
      let timestamp: Date;
      if (msg.timestamp) {
        timestamp = new Date(msg.timestamp);
      } else if (session.timestamp) {
        timestamp = new Date(session.timestamp);
      } else {
        continue; // Skip if no timestamp available
      }

      // Verify year
      if (timestamp.getFullYear() !== year) continue;

      // Process and sanitize the question
      const processed = processQuestion(msg.content, timestamp, maxLength);

      // Skip if content is effectively empty after sanitization
      if (processed.content.trim().length < 10) continue;

      questions.push(processed);
    }
  }

  return questions;
}

// ============================================================================
// Year Pack Assembly
// ============================================================================

/**
 * Build the complete YearPack object
 */
function buildYearPack(
  questions: ProcessedQuestion[],
  input: YearPackInput,
  sessionCount: number
): YearPack {
  const { year, language, workspace, maxSamples, maxSampleLength, topicsCount } = input;

  // Calculate statistics
  const { totalQuestions, activeMonths, monthlyDistribution, lengthBuckets } =
    calculateStats(questions);

  // Extract keywords
  const keywords = extractKeywords(
    questions.map((q) => q.content),
    language,
    DEFAULT_CONFIG.topUnigrams,
    DEFAULT_CONFIG.topBigrams
  );

  // Extract topics (with graceful degradation)
  const topics = shouldSkipTopics(totalQuestions)
    ? []
    : extractTopics(questions, year, language, topicsCount);

  // Select safe samples
  const samples = selectSafeSamples(questions, maxSamples, maxSampleLength);

  // Build meta
  const meta: YearPackMeta = {
    year,
    language,
    generatedAt: new Date().toISOString(),
    workspace: workspace ?? null,
    questionCount: totalQuestions,
    sessionCount,
  };

  // Build safety info
  const safety = {
    filtersApplied: getAppliedFilters(),
    guarantees: [...SAFETY_GUARANTEES],
  };

  // Build notes
  const notes: string[] = [
    "Data is aggregated and sanitized for entertainment purposes.",
    "Topic trends indicate focus shifts, not exact timelines.",
  ];

  if (shouldSkipTopics(totalQuestions)) {
    notes.push(
      `Topic extraction skipped: fewer than 50 questions (${totalQuestions} found).`
    );
  }

  return {
    meta,
    stats: {
      totalQuestions,
      activeMonths,
      monthlyDistribution,
    },
    lengthBuckets,
    keywords,
    topics,
    samples,
    safety,
    notes,
  };
}

// ============================================================================
// Tool Handler
// ============================================================================

/**
 * Handle the year-pack tool invocation
 */
export async function handleYearPack(
  args: Record<string, unknown>
): Promise<string> {
  const startTime = Date.now();
  try {
    // Parse and validate input
    const input = YearPackInputSchema.parse(args);
    const { year, language, workspace } = input;

    // Fetch sessions for the year
    const { sessions, sessionCount } = await fetchSessionsForYear(
      year,
      workspace
    );

    // Handle no sessions case
    if (sessionCount === 0) {
      const workspaceMsg = workspace
        ? ` in workspace "${workspace}"`
        : "";
      return `No chat sessions found for year ${year}${workspaceMsg}. ` +
        `Make sure you have Cursor AI chat history for this period.`;
    }

    // Extract user questions
    const questions = extractUserQuestions(
      sessions,
      year,
      DEFAULT_CONFIG.maxLineChars
    );

    // Handle no questions case
    if (questions.length === 0) {
      return `Found ${sessionCount} session(s) for year ${year}, but no user questions were extracted. ` +
        `Sessions may only contain assistant responses or tool calls.`;
    }

    // Build year pack
    const yearPack = buildYearPack(questions, input, sessionCount);

    // Generate prompt template
    const promptTemplate = generatePromptTemplate(yearPack, language);

    // Build response
    const response: YearPackResponse = {
      yearPack,
      promptTemplate,
    };

    // Calculate processing time
    const processingTimeMs = Date.now() - startTime;
    const processingTimeSec = (processingTimeMs / 1000).toFixed(2);

    // Format output
    const output = [
      `# Year Pack Generated Successfully`,
      ``,
      `**Year**: ${year}`,
      `**Language**: ${language}`,
      `**Sessions Analyzed**: ${sessionCount}`,
      `**Questions Processed**: ${questions.length}`,
      `**Topics Extracted**: ${yearPack.topics.length}`,
      `**Processing Time**: ${processingTimeSec}s`,
      ``,
      `## Year Pack JSON`,
      ``,
      "```json",
      JSON.stringify(response.yearPack, null, 2),
      "```",
      ``,
      `## Prompt Template`,
      ``,
      `The prompt template is included below. Copy it and use it with any LLM to generate your annual report.`,
      ``,
      "---",
      ``,
      response.promptTemplate,
    ];

    return output.join("\n");
  } catch (error) {
    const mcpError = mapCursorHistoryError(error);
    if (isMcpError(mcpError)) {
      throw new Error(mcpError.message);
    }
    throw error;
  }
}
