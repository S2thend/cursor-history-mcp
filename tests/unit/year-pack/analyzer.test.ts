/**
 * Unit tests for analyzer module
 */

import { describe, it, expect } from "vitest";
import {
  tokenize,
  tokenizeWithoutStopwords,
  generateBigrams,
  countFrequencies,
  getTopTerms,
  extractKeywords,
  getWeekNumber,
  getYearPeriod,
  getLengthBucket,
  isQuestionFormat,
  processQuestion,
} from "../../../src/tools/year-pack/analyzer.js";

describe("analyzer", () => {
  describe("tokenize", () => {
    it("should tokenize text into words", () => {
      const result = tokenize("How do I use TypeScript?");
      expect(result).toContain("how");
      expect(result).toContain("use");
      expect(result).toContain("typescript");
    });

    it("should filter out short tokens", () => {
      const result = tokenize("I am a developer");
      expect(result).not.toContain("i");
      expect(result).not.toContain("am");
      expect(result).toContain("developer");
    });

    it("should handle tech terms with hyphens", () => {
      const result = tokenize("Use type-safe code");
      expect(result).toContain("type-safe");
      expect(result).toContain("code");
    });

    it("should lowercase all tokens", () => {
      const result = tokenize("TypeScript JavaScript NodeJS");
      expect(result).toContain("typescript");
      expect(result).toContain("javascript");
      expect(result).toContain("nodejs");
    });
  });

  describe("tokenizeWithoutStopwords", () => {
    it("should filter English stopwords", () => {
      const result = tokenizeWithoutStopwords("How do I use the API?", "en");
      expect(result).not.toContain("how");
      expect(result).not.toContain("the");
      expect(result).toContain("api");
    });
  });

  describe("generateBigrams", () => {
    it("should generate word pairs", () => {
      const tokens = ["api", "request", "error"];
      const result = generateBigrams(tokens);
      expect(result).toContain("api request");
      expect(result).toContain("request error");
    });

    it("should return empty for single token", () => {
      expect(generateBigrams(["single"])).toEqual([]);
    });
  });

  describe("countFrequencies", () => {
    it("should count term occurrences", () => {
      const terms = ["api", "error", "api", "api", "error"];
      const result = countFrequencies(terms);
      expect(result.get("api")).toBe(3);
      expect(result.get("error")).toBe(2);
    });
  });

  describe("getTopTerms", () => {
    it("should return top N terms by frequency", () => {
      const freq = new Map([
        ["a", 10],
        ["b", 5],
        ["c", 15],
        ["d", 1],
      ]);
      const result = getTopTerms(freq, 2);
      expect(result).toHaveLength(2);
      expect(result[0]?.term).toBe("c");
      expect(result[1]?.term).toBe("a");
    });
  });

  describe("extractKeywords", () => {
    it("should extract unigrams and bigrams", () => {
      const texts = [
        "api request error",
        "api response data",
        "error handling code",
      ];
      const result = extractKeywords(texts, "en", 5, 3);
      expect(result.topUnigrams.length).toBeGreaterThan(0);
      expect(result.topBigrams.length).toBeGreaterThan(0);
    });
  });

  describe("getWeekNumber", () => {
    it("should return correct week number", () => {
      // First week of January 2025
      const date = new Date("2025-01-06");
      const week = getWeekNumber(date);
      expect(week).toBeGreaterThanOrEqual(1);
      expect(week).toBeLessThanOrEqual(2);
    });

    it("should return week 52 or 53 for late December", () => {
      const date = new Date("2025-12-28");
      const week = getWeekNumber(date);
      expect(week).toBeGreaterThanOrEqual(52);
    });
  });

  describe("getYearPeriod", () => {
    it("should return early for Jan-Apr", () => {
      expect(getYearPeriod(1)).toBe("early");
      expect(getYearPeriod(4)).toBe("early");
    });

    it("should return mid for May-Aug", () => {
      expect(getYearPeriod(5)).toBe("mid");
      expect(getYearPeriod(8)).toBe("mid");
    });

    it("should return late for Sep-Dec", () => {
      expect(getYearPeriod(9)).toBe("late");
      expect(getYearPeriod(12)).toBe("late");
    });
  });

  describe("getLengthBucket", () => {
    it("should categorize short messages", () => {
      expect(getLengthBucket(50)).toBe("short");
      expect(getLengthBucket(100)).toBe("short");
    });

    it("should categorize medium messages", () => {
      expect(getLengthBucket(101)).toBe("medium");
      expect(getLengthBucket(280)).toBe("medium");
    });

    it("should categorize long messages", () => {
      expect(getLengthBucket(281)).toBe("long");
      expect(getLengthBucket(1000)).toBe("long");
    });
  });

  describe("isQuestionFormat", () => {
    it("should detect questions ending with ?", () => {
      expect(isQuestionFormat("What is TypeScript?")).toBe(true);
    });

    it("should detect questions starting with question words", () => {
      expect(isQuestionFormat("How to install npm")).toBe(true);
      expect(isQuestionFormat("Why does this fail")).toBe(true);
      expect(isQuestionFormat("Can you help me")).toBe(true);
    });

    it("should return false for statements", () => {
      expect(isQuestionFormat("Install npm first")).toBe(false);
    });
  });

  describe("processQuestion", () => {
    it("should process question with metadata", () => {
      const content = "How do I use TypeScript?";
      const timestamp = new Date("2025-06-15");
      const result = processQuestion(content, timestamp);

      expect(result.content).toBe(content);
      expect(result.originalLength).toBe(content.length);
      expect(result.month).toBe("2025-06");
      expect(result.week).toBeGreaterThan(0);
    });

    it("should sanitize content", () => {
      const content = "Check /path/to/file.ts";
      const timestamp = new Date("2025-01-01");
      const result = processQuestion(content, timestamp);

      expect(result.content).toContain("[PATH]");
      expect(result.content).not.toContain("/path/to");
    });
  });
});
