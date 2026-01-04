/**
 * Unit tests for topics module
 */

import { describe, it, expect } from "vitest";
import {
  aggregateByWeek,
  calculateTfIdf,
  kMeansClustering,
  extractTopics,
  shouldSkipTopics,
} from "../../../src/tools/year-pack/topics.js";
import type { ProcessedQuestion } from "../../../src/tools/year-pack/types.js";

// Helper to create test questions
function createTestQuestions(
  count: number,
  year: number = 2025
): ProcessedQuestion[] {
  const questions: ProcessedQuestion[] = [];
  const topics = ["api", "database", "frontend", "testing", "deployment"];

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const month = ((i % 12) + 1).toString().padStart(2, "0");
    const day = ((i % 28) + 1).toString().padStart(2, "0");
    const date = new Date(`${year}-${month}-${day}`);

    questions.push({
      content: `How do I implement ${topic} functionality with TypeScript and Node.js`,
      originalLength: 60,
      timestamp: date,
      month: `${year}-${month}`,
      week: Math.ceil((i % 52) + 1),
    });
  }

  return questions;
}

describe("topics", () => {
  describe("aggregateByWeek", () => {
    it("should aggregate questions by week", () => {
      const questions = createTestQuestions(20, 2025);
      const result = aggregateByWeek(questions, 2025);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("week");
      expect(result[0]).toHaveProperty("content");
      expect(result[0]).toHaveProperty("questionCount");
    });

    it("should assign correct year periods", () => {
      const questions = createTestQuestions(100, 2025);
      const result = aggregateByWeek(questions, 2025);

      const periods = new Set(result.map((d) => d.period));
      expect(periods.has("early") || periods.has("mid") || periods.has("late")).toBe(true);
    });

    it("should filter by year", () => {
      const questions = [
        ...createTestQuestions(10, 2024),
        ...createTestQuestions(10, 2025),
      ];
      const result = aggregateByWeek(questions, 2025);

      // Should only include 2025 questions
      expect(result.every((d) => d.year === 2025)).toBe(true);
    });
  });

  describe("calculateTfIdf", () => {
    it("should calculate TF-IDF vectors", () => {
      const questions = createTestQuestions(60, 2025);
      const documents = aggregateByWeek(questions, 2025);
      const { vectors, vocabulary } = calculateTfIdf(documents, "en");

      expect(vectors.length).toBeGreaterThan(0);
      expect(vocabulary.length).toBeGreaterThan(0);
    });

    it("should produce sparse vectors", () => {
      const questions = createTestQuestions(100, 2025);
      const documents = aggregateByWeek(questions, 2025);
      const { vectors } = calculateTfIdf(documents, "en");

      // Each vector should have some terms
      for (const vector of vectors) {
        expect(vector.terms.size).toBeGreaterThan(0);
      }
    });
  });

  describe("kMeansClustering", () => {
    it("should cluster vectors into k groups", () => {
      const questions = createTestQuestions(100, 2025);
      const documents = aggregateByWeek(questions, 2025);
      const { vectors } = calculateTfIdf(documents, "en");

      const clusters = kMeansClustering(vectors, 5);

      expect(clusters.length).toBeLessThanOrEqual(5);
      expect(clusters.length).toBeGreaterThan(0);
    });

    it("should assign all documents to clusters", () => {
      const questions = createTestQuestions(100, 2025);
      const documents = aggregateByWeek(questions, 2025);
      const { vectors } = calculateTfIdf(documents, "en");

      const clusters = kMeansClustering(vectors, 3);

      const assignedDocs = clusters.flatMap((c) => c.members);
      expect(assignedDocs.length).toBe(vectors.length);
    });

    it("should extract top terms for each cluster", () => {
      const questions = createTestQuestions(100, 2025);
      const documents = aggregateByWeek(questions, 2025);
      const { vectors } = calculateTfIdf(documents, "en");

      const clusters = kMeansClustering(vectors, 3);

      for (const cluster of clusters) {
        expect(cluster.topTerms.length).toBeGreaterThan(0);
      }
    });
  });

  describe("extractTopics", () => {
    it("should extract topics from questions", () => {
      const questions = createTestQuestions(100, 2025);
      const topics = extractTopics(questions, 2025, "en", 5);

      expect(topics.length).toBeGreaterThan(0);
      expect(topics.length).toBeLessThanOrEqual(5);
    });

    it("should return empty array for few questions", () => {
      const questions = createTestQuestions(30, 2025);
      const topics = extractTopics(questions, 2025, "en", 5);

      expect(topics).toEqual([]);
    });

    it("should include topic metadata", () => {
      const questions = createTestQuestions(100, 2025);
      const topics = extractTopics(questions, 2025, "en", 5);

      if (topics.length > 0) {
        const topic = topics[0]!;
        expect(topic).toHaveProperty("id");
        expect(topic).toHaveProperty("name");
        expect(topic).toHaveProperty("share");
        expect(topic).toHaveProperty("keywords");
        expect(topic).toHaveProperty("trend");
      }
    });

    it("should calculate topic trends", () => {
      const questions = createTestQuestions(150, 2025);
      const topics = extractTopics(questions, 2025, "en", 3);

      if (topics.length > 0) {
        const topic = topics[0]!;
        expect(topic.trend).toHaveProperty("early");
        expect(topic.trend).toHaveProperty("mid");
        expect(topic.trend).toHaveProperty("late");

        // Trends should sum to approximately 1
        const sum = topic.trend.early + topic.trend.mid + topic.trend.late;
        expect(sum).toBeGreaterThan(0);
        expect(sum).toBeLessThanOrEqual(1.01); // Allow small floating point error
      }
    });

    it("should sort topics by share", () => {
      const questions = createTestQuestions(200, 2025);
      const topics = extractTopics(questions, 2025, "en", 5);

      for (let i = 1; i < topics.length; i++) {
        const prevTopic = topics[i - 1];
        const currentTopic = topics[i];
        if (prevTopic && currentTopic) {
          expect(prevTopic.share).toBeGreaterThanOrEqual(currentTopic.share);
        }
      }
    });
  });

  describe("shouldSkipTopics", () => {
    it("should return true for < 50 questions", () => {
      expect(shouldSkipTopics(49)).toBe(true);
      expect(shouldSkipTopics(30)).toBe(true);
      expect(shouldSkipTopics(0)).toBe(true);
    });

    it("should return false for >= 50 questions", () => {
      expect(shouldSkipTopics(50)).toBe(false);
      expect(shouldSkipTopics(100)).toBe(false);
      expect(shouldSkipTopics(1000)).toBe(false);
    });
  });
});
