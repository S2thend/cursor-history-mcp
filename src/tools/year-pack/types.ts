/**
 * YearPack types - Data structures for the annual report generator
 * Based on data-model.md specification
 */

import { z } from "zod";

// ============================================================================
// Input Configuration
// ============================================================================

/**
 * Input validation schema for the year-pack tool
 */
export const YearPackInputSchema = z.object({
  year: z
    .number()
    .int()
    .min(1970)
    .max(new Date().getFullYear())
    .optional()
    .default(() => new Date().getFullYear()),
  language: z.enum(["en", "zh"]).optional().default("en"),
  workspace: z.string().optional(),
  maxSamples: z.number().int().min(0).max(100).optional().default(30),
  maxSampleLength: z.number().int().min(50).max(500).optional().default(120),
  topicsCount: z.number().int().min(3).max(15).optional().default(7),
});

export type YearPackInput = z.infer<typeof YearPackInputSchema>;

// ============================================================================
// Output Types
// ============================================================================

/**
 * Metadata about the generation
 */
export interface YearPackMeta {
  year: number;
  language: "en" | "zh";
  generatedAt: string;
  workspace: string | null;
  questionCount: number;
  sessionCount: number;
}

/**
 * Statistical summary of chat activity
 */
export interface YearPackStats {
  totalQuestions: number;
  activeMonths: number;
  monthlyDistribution: Record<string, number>; // "YYYY-MM": count
}

/**
 * Distribution of question lengths
 */
export interface LengthBuckets {
  short: number; // 0-100 chars
  medium: number; // 101-280 chars
  long: number; // 281+ chars
}

/**
 * A term with its frequency
 */
export interface KeywordItem {
  term: string;
  count: number;
}

/**
 * Keyword frequency analysis
 */
export interface YearPackKeywords {
  topUnigrams: KeywordItem[];
  topBigrams: KeywordItem[];
}

/**
 * Topic distribution across year periods
 */
export interface TopicTrend {
  early: number; // Jan-Apr share (0.0-1.0)
  mid: number; // May-Aug share (0.0-1.0)
  late: number; // Sep-Dec share (0.0-1.0)
}

/**
 * A thematic cluster extracted via TF-IDF + K-Means
 */
export interface Topic {
  id: number;
  name: string;
  share: number; // 0.0-1.0
  keywords: string[];
  trend: TopicTrend;
}

/**
 * Sanitized sample questions
 */
export interface YearPackSamples {
  questions: string[];
  maxLength: number;
}

/**
 * Safety metadata documenting applied filters
 */
export interface YearPackSafety {
  filtersApplied: string[];
  guarantees: string[];
}

/**
 * The complete YearPack output structure
 */
export interface YearPack {
  meta: YearPackMeta;
  stats: YearPackStats;
  lengthBuckets: LengthBuckets;
  keywords: YearPackKeywords;
  topics: Topic[];
  samples: YearPackSamples;
  safety: YearPackSafety;
  notes: string[];
}

/**
 * Tool response combining YearPack and prompt template
 */
export interface YearPackResponse {
  yearPack: YearPack;
  promptTemplate: string;
}

// ============================================================================
// Internal Processing Types
// ============================================================================

/**
 * A sanitized user question with metadata
 */
export interface ProcessedQuestion {
  content: string;
  originalLength: number;
  timestamp: Date;
  month: string; // "YYYY-MM"
  week: number; // Week of year (1-52)
}

/**
 * Week-aggregated document for topic extraction
 */
export interface WeekDocument {
  week: number;
  year: number;
  period: "early" | "mid" | "late";
  content: string;
  questionCount: number;
}

/**
 * TF-IDF vector for a document
 */
export interface TfIdfVector {
  docId: number;
  terms: Map<string, number>;
}

/**
 * K-Means cluster result
 */
export interface Cluster {
  id: number;
  centroid: Map<string, number>;
  members: number[]; // Document IDs
  topTerms: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Standard filters applied during sanitization
 */
export const SANITIZATION_FILTERS = [
  "user_messages_only",
  "code_blocks_removed",
  "commands_removed",
  "paths_masked",
  "urls_masked",
  "emails_masked",
  "ips_masked",
  "secrets_masked",
  "truncated_long_text",
] as const;

/**
 * Safety guarantees provided by the output
 */
export const SAFETY_GUARANTEES = [
  "no_executable_content",
  "no_file_paths",
  "no_urls",
  "no_credentials",
] as const;

/**
 * Minimum questions required for topic extraction
 */
export const MIN_QUESTIONS_FOR_TOPICS = 50;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  maxLineChars: 280,
  maxSamples: 30,
  maxSampleLength: 120,
  maxVocab: 3000,
  minDf: 5,
  maxDfRatio: 0.6,
  kTopics: 7,
  kmeansIterations: 25,
  topTermsPerTopic: 5,
  topUnigrams: 50,
  topBigrams: 30,
} as const;
