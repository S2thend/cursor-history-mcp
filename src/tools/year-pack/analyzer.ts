/**
 * Text analysis utilities for year-pack
 * Includes tokenization, frequency counting, and statistics calculation
 */

import {
  type KeywordItem,
  type LengthBuckets,
  type YearPackStats,
  type ProcessedQuestion,
  type YearPackSamples,
  DEFAULT_CONFIG,
} from "./types.js";
import { getStopwords } from "./stopwords.js";
import { sanitize, containsSensitiveContent } from "./sanitizer.js";

// ============================================================================
// Tokenization
// ============================================================================

/**
 * Tokenize text into words using regex
 * - Converts to lowercase
 * - Extracts alphanumeric tokens (including tech terms with underscores/hyphens)
 * - Filters out tokens shorter than 3 characters
 */
export function tokenize(text: string): string[] {
  // Match words with letters, numbers, hyphens, underscores
  const tokens = text
    .toLowerCase()
    .match(/[a-z][a-z0-9_-]*[a-z0-9]|[a-z]{3,}/g);

  if (!tokens) return [];

  // Filter out very short tokens
  return tokens.filter((t) => t.length >= 3);
}

/**
 * Tokenize text and filter stopwords
 */
export function tokenizeWithoutStopwords(
  text: string,
  language: "en" | "zh" = "en"
): string[] {
  const tokens = tokenize(text);
  const stopwords = getStopwords(language);
  return tokens.filter((t) => !stopwords.has(t));
}

/**
 * Generate bigrams (word pairs) from tokens
 */
export function generateBigrams(tokens: string[]): string[] {
  if (tokens.length < 2) return [];

  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const token1 = tokens[i];
    const token2 = tokens[i + 1];
    if (token1 && token2) {
      bigrams.push(`${token1} ${token2}`);
    }
  }
  return bigrams;
}

// ============================================================================
// Frequency Counting
// ============================================================================

/**
 * Count term frequencies
 */
export function countFrequencies(terms: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const term of terms) {
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return counts;
}

/**
 * Get top N terms by frequency
 */
export function getTopTerms(
  frequencies: Map<string, number>,
  n: number
): KeywordItem[] {
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term, count]) => ({ term, count }));
}

/**
 * Extract top unigrams and bigrams from a collection of texts
 */
export function extractKeywords(
  texts: string[],
  language: "en" | "zh" = "en",
  topUnigrams: number = DEFAULT_CONFIG.topUnigrams,
  topBigrams: number = DEFAULT_CONFIG.topBigrams
): { topUnigrams: KeywordItem[]; topBigrams: KeywordItem[] } {
  const allUnigrams: string[] = [];
  const allBigrams: string[] = [];

  for (const text of texts) {
    const tokens = tokenizeWithoutStopwords(text, language);
    allUnigrams.push(...tokens);
    allBigrams.push(...generateBigrams(tokens));
  }

  const unigramFreq = countFrequencies(allUnigrams);
  const bigramFreq = countFrequencies(allBigrams);

  return {
    topUnigrams: getTopTerms(unigramFreq, topUnigrams),
    topBigrams: getTopTerms(bigramFreq, topBigrams),
  };
}

// ============================================================================
// Statistics Calculation
// ============================================================================

/**
 * Get ISO week number for a date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get year period (early/mid/late) for a month
 */
export function getYearPeriod(month: number): "early" | "mid" | "late" {
  if (month >= 1 && month <= 4) return "early";
  if (month >= 5 && month <= 8) return "mid";
  return "late";
}

/**
 * Calculate length bucket for a text
 */
export function getLengthBucket(length: number): "short" | "medium" | "long" {
  if (length <= 100) return "short";
  if (length <= 280) return "medium";
  return "long";
}

/**
 * Calculate statistics from processed questions
 */
export function calculateStats(
  questions: ProcessedQuestion[]
): YearPackStats & { lengthBuckets: LengthBuckets } {
  const monthlyDistribution: Record<string, number> = {};
  const lengthBuckets: LengthBuckets = { short: 0, medium: 0, long: 0 };

  for (const q of questions) {
    // Monthly distribution
    monthlyDistribution[q.month] = (monthlyDistribution[q.month] ?? 0) + 1;

    // Length buckets
    const bucket = getLengthBucket(q.originalLength);
    lengthBuckets[bucket]++;
  }

  const activeMonths = Object.keys(monthlyDistribution).length;

  return {
    totalQuestions: questions.length,
    activeMonths,
    monthlyDistribution,
    lengthBuckets,
  };
}

// ============================================================================
// Question Processing
// ============================================================================

/**
 * Process a raw user message into a ProcessedQuestion
 */
export function processQuestion(
  content: string,
  timestamp: Date,
  maxLength: number = DEFAULT_CONFIG.maxLineChars
): ProcessedQuestion {
  const originalLength = content.length;
  const sanitized = sanitize(content, { maxLength });

  const month = `${timestamp.getFullYear()}-${String(
    timestamp.getMonth() + 1
  ).padStart(2, "0")}`;
  const week = getWeekNumber(timestamp);

  return {
    content: sanitized,
    originalLength,
    timestamp,
    month,
    week,
  };
}

// ============================================================================
// Safe Sample Selection
// ============================================================================

/**
 * Check if text looks like a question
 */
export function isQuestionFormat(text: string): boolean {
  // Ends with question mark
  if (text.trim().endsWith("?")) return true;

  // Starts with question words
  const questionWords = [
    "how",
    "what",
    "why",
    "when",
    "where",
    "who",
    "which",
    "can",
    "could",
    "would",
    "should",
    "is",
    "are",
    "does",
    "do",
    "will",
  ];

  const firstWord = text.trim().toLowerCase().split(/\s+/)[0];
  return firstWord ? questionWords.includes(firstWord) : false;
}

/**
 * Select safe sample questions from processed questions
 */
export function selectSafeSamples(
  questions: ProcessedQuestion[],
  maxSamples: number = DEFAULT_CONFIG.maxSamples,
  maxLength: number = DEFAULT_CONFIG.maxSampleLength
): YearPackSamples {
  // Filter and prepare candidates
  const candidates = questions
    .filter((q) => {
      // Must be short enough
      if (q.content.length > maxLength) return false;

      // Must not contain remaining sensitive content
      if (containsSensitiveContent(q.content)) return false;

      // Must not be too short
      if (q.content.length < 20) return false;

      // Must not be just placeholders
      if (/^\s*\[(?:PATH|URL|EMAIL|IP|SECRET|TRUNCATED)\]\s*$/.test(q.content))
        return false;

      return true;
    })
    .map((q) => ({
      content: q.content,
      isQuestion: isQuestionFormat(q.content),
      length: q.content.length,
    }));

  // Sort: prefer questions, then by length (shorter is better for samples)
  candidates.sort((a, b) => {
    if (a.isQuestion !== b.isQuestion) {
      return a.isQuestion ? -1 : 1;
    }
    return a.length - b.length;
  });

  // Use reservoir sampling to get diverse samples
  const selected: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    // Normalize for deduplication
    const normalized = candidate.content.toLowerCase().trim();
    if (seen.has(normalized)) continue;

    selected.push(candidate.content);
    seen.add(normalized);

    if (selected.length >= maxSamples) break;
  }

  return {
    questions: selected,
    maxLength,
  };
}
