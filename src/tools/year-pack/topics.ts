/**
 * Topic extraction using TF-IDF and K-Means clustering
 * Pure TypeScript implementation for compatibility
 */

import {
  type Topic,
  type TopicTrend,
  type ProcessedQuestion,
  type WeekDocument,
  type TfIdfVector,
  type Cluster,
  DEFAULT_CONFIG,
  MIN_QUESTIONS_FOR_TOPICS,
} from "./types.js";
import { tokenizeWithoutStopwords } from "./analyzer.js";

// ============================================================================
// Week Aggregation
// ============================================================================

/**
 * Aggregate questions by week into documents
 */
export function aggregateByWeek(
  questions: ProcessedQuestion[],
  year: number
): WeekDocument[] {
  const weekMap = new Map<number, { content: string[]; count: number }>();

  for (const q of questions) {
    // Only include questions from the target year
    if (q.timestamp.getFullYear() !== year) continue;

    const existing = weekMap.get(q.week) ?? { content: [], count: 0 };
    existing.content.push(q.content);
    existing.count++;
    weekMap.set(q.week, existing);
  }

  const documents: WeekDocument[] = [];
  for (const [week, data] of weekMap) {
    // Determine period based on week number
    let period: "early" | "mid" | "late";
    if (week <= 17) period = "early"; // ~Jan-Apr
    else if (week <= 35) period = "mid"; // ~May-Aug
    else period = "late"; // ~Sep-Dec

    documents.push({
      week,
      year,
      period,
      content: data.content.join(" "),
      questionCount: data.count,
    });
  }

  // Sort by week number
  return documents.sort((a, b) => a.week - b.week);
}

// ============================================================================
// TF-IDF Calculation
// ============================================================================

/**
 * Calculate term frequency (normalized by document length)
 */
function calculateTf(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  // Normalize by document length
  const length = tokens.length;
  const tf = new Map<string, number>();
  for (const [term, count] of counts) {
    tf.set(term, count / length);
  }
  return tf;
}

/**
 * Calculate document frequency for all terms across documents
 */
function calculateDf(
  documents: string[][],
  minDf: number,
  maxDfRatio: number
): Map<string, number> {
  const df = new Map<string, number>();
  const docCount = documents.length;

  // Count how many documents each term appears in
  for (const tokens of documents) {
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  // Filter by minDf and maxDfRatio
  const maxDf = Math.floor(docCount * maxDfRatio);
  const filtered = new Map<string, number>();
  for (const [term, count] of df) {
    if (count >= minDf && count <= maxDf) {
      filtered.set(term, count);
    }
  }

  return filtered;
}

/**
 * Calculate TF-IDF vectors for all documents
 */
export function calculateTfIdf(
  documents: WeekDocument[],
  language: "en" | "zh" = "en",
  minDf: number = DEFAULT_CONFIG.minDf,
  maxDfRatio: number = DEFAULT_CONFIG.maxDfRatio
): { vectors: TfIdfVector[]; vocabulary: string[] } {
  // Tokenize all documents
  const tokenizedDocs = documents.map((doc) =>
    tokenizeWithoutStopwords(doc.content, language)
  );

  // Calculate document frequencies
  const df = calculateDf(tokenizedDocs, minDf, maxDfRatio);
  const vocabulary = Array.from(df.keys());
  const N = documents.length;

  // Calculate TF-IDF for each document
  const vectors: TfIdfVector[] = [];
  for (let i = 0; i < tokenizedDocs.length; i++) {
    const tokens = tokenizedDocs[i];
    if (!tokens) continue;

    const tf = calculateTf(tokens);
    const tfidf = new Map<string, number>();

    for (const term of vocabulary) {
      const tfVal = tf.get(term) ?? 0;
      if (tfVal === 0) continue;

      const dfVal = df.get(term) ?? 1;
      const idf = Math.log(N / dfVal);
      tfidf.set(term, tfVal * idf);
    }

    vectors.push({ docId: i, terms: tfidf });
  }

  return { vectors, vocabulary };
}

// ============================================================================
// K-Means Clustering
// ============================================================================

/**
 * Calculate Euclidean distance between two sparse vectors
 */
function vectorDistance(
  v1: Map<string, number>,
  v2: Map<string, number>
): number {
  const allTerms = new Set([...v1.keys(), ...v2.keys()]);
  let sum = 0;
  for (const term of allTerms) {
    const diff = (v1.get(term) ?? 0) - (v2.get(term) ?? 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Calculate centroid of a cluster
 */
function calculateCentroid(
  vectors: TfIdfVector[],
  memberIds: number[]
): Map<string, number> {
  if (memberIds.length === 0) return new Map();

  const sum = new Map<string, number>();
  for (const id of memberIds) {
    const vector = vectors.find((v) => v.docId === id);
    if (!vector) continue;

    for (const [term, value] of vector.terms) {
      sum.set(term, (sum.get(term) ?? 0) + value);
    }
  }

  // Average
  const centroid = new Map<string, number>();
  for (const [term, value] of sum) {
    centroid.set(term, value / memberIds.length);
  }
  return centroid;
}

/**
 * K-Means++ initialization for better initial centroids
 */
function kMeansPlusPlusInit(
  vectors: TfIdfVector[],
  k: number
): Map<string, number>[] {
  if (vectors.length === 0) return [];
  if (vectors.length <= k) {
    return vectors.map((v) => new Map(v.terms));
  }

  const centroids: Map<string, number>[] = [];

  // Pick first centroid randomly
  const firstIdx = Math.floor(Math.random() * vectors.length);
  const firstVector = vectors[firstIdx];
  if (firstVector) {
    centroids.push(new Map(firstVector.terms));
  }

  // Pick remaining centroids with probability proportional to distance squared
  while (centroids.length < k) {
    const distances: number[] = [];
    let totalDist = 0;

    for (const vector of vectors) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = vectorDistance(vector.terms, centroid);
        minDist = Math.min(minDist, dist);
      }
      distances.push(minDist * minDist);
      totalDist += minDist * minDist;
    }

    // Weighted random selection
    let threshold = Math.random() * totalDist;
    for (let i = 0; i < distances.length; i++) {
      const dist = distances[i];
      if (dist === undefined) continue;
      threshold -= dist;
      if (threshold <= 0) {
        const selectedVector = vectors[i];
        if (selectedVector) {
          centroids.push(new Map(selectedVector.terms));
        }
        break;
      }
    }
  }

  return centroids;
}

/**
 * Assign vectors to nearest centroid
 */
function assignToClusters(
  vectors: TfIdfVector[],
  centroids: Map<string, number>[]
): number[][] {
  const clusters: number[][] = centroids.map(() => []);

  for (const vector of vectors) {
    let minDist = Infinity;
    let closestCluster = 0;

    for (let i = 0; i < centroids.length; i++) {
      const centroid = centroids[i];
      if (!centroid) continue;
      const dist = vectorDistance(vector.terms, centroid);
      if (dist < minDist) {
        minDist = dist;
        closestCluster = i;
      }
    }

    clusters[closestCluster]?.push(vector.docId);
  }

  return clusters;
}

/**
 * Run K-Means clustering
 */
export function kMeansClustering(
  vectors: TfIdfVector[],
  k: number,
  maxIterations: number = DEFAULT_CONFIG.kmeansIterations
): Cluster[] {
  if (vectors.length === 0) return [];

  // Adjust k if we have fewer documents
  const actualK = Math.min(k, vectors.length);

  // Initialize centroids using k-means++
  let centroids = kMeansPlusPlusInit(vectors, actualK);

  // Iterate
  let assignments: number[][] = [];
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign to clusters
    assignments = assignToClusters(vectors, centroids);

    // Update centroids
    const newCentroids: Map<string, number>[] = [];
    for (let i = 0; i < actualK; i++) {
      const members = assignments[i] ?? [];
      if (members.length > 0) {
        newCentroids.push(calculateCentroid(vectors, members));
      } else {
        // Keep old centroid if cluster is empty
        const oldCentroid = centroids[i];
        if (oldCentroid) {
          newCentroids.push(oldCentroid);
        }
      }
    }
    centroids = newCentroids;
  }

  // Build cluster objects
  const clusters: Cluster[] = [];
  for (let i = 0; i < actualK; i++) {
    const members = assignments[i] ?? [];
    const centroid = centroids[i] ?? new Map();

    // Get top terms from centroid
    const topTerms = Array.from(centroid.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, DEFAULT_CONFIG.topTermsPerTopic)
      .map(([term]) => term);

    clusters.push({
      id: i,
      centroid,
      members,
      topTerms,
    });
  }

  return clusters;
}

// ============================================================================
// Topic Generation
// ============================================================================

/**
 * Generate topic name from keywords
 */
function generateTopicName(keywords: string[]): string {
  if (keywords.length === 0) return "General";

  // Capitalize first keyword
  const primary = keywords[0];
  if (!primary) return "General";

  // Format: "Primary + Secondary" or just "Primary"
  const formatted =
    primary.charAt(0).toUpperCase() + primary.slice(1).replace(/-/g, " ");

  if (keywords.length > 1 && keywords[1]) {
    const secondary = keywords[1].replace(/-/g, " ");
    return `${formatted} & ${secondary}`;
  }

  return formatted;
}

/**
 * Calculate topic trends across year periods
 */
function calculateTopicTrend(
  cluster: Cluster,
  documents: WeekDocument[]
): TopicTrend {
  const periodCounts = { early: 0, mid: 0, late: 0 };
  let totalQuestions = 0;

  for (const docId of cluster.members) {
    const doc = documents[docId];
    if (!doc) continue;

    periodCounts[doc.period] += doc.questionCount;
    totalQuestions += doc.questionCount;
  }

  if (totalQuestions === 0) {
    return { early: 0, mid: 0, late: 0 };
  }

  return {
    early: periodCounts.early / totalQuestions,
    mid: periodCounts.mid / totalQuestions,
    late: periodCounts.late / totalQuestions,
  };
}

/**
 * Extract topics from processed questions
 */
export function extractTopics(
  questions: ProcessedQuestion[],
  year: number,
  language: "en" | "zh" = "en",
  k: number = DEFAULT_CONFIG.kTopics
): Topic[] {
  // Check minimum questions threshold
  if (questions.length < MIN_QUESTIONS_FOR_TOPICS) {
    return [];
  }

  // Aggregate by week
  const documents = aggregateByWeek(questions, year);

  // Need at least k documents for k clusters
  if (documents.length < k) {
    // Reduce k to document count
    k = Math.max(1, documents.length);
  }

  // Calculate TF-IDF
  const { vectors } = calculateTfIdf(documents, language);

  // Cluster
  const clusters = kMeansClustering(vectors, k);

  // Calculate total questions for share calculation
  const totalQuestions = questions.filter(
    (q) => q.timestamp.getFullYear() === year
  ).length;

  // Build topics
  const topics: Topic[] = [];
  for (const cluster of clusters) {
    // Calculate share (portion of total questions in this cluster)
    let clusterQuestions = 0;
    for (const docId of cluster.members) {
      const doc = documents[docId];
      if (doc) clusterQuestions += doc.questionCount;
    }
    const share = totalQuestions > 0 ? clusterQuestions / totalQuestions : 0;

    // Skip very small clusters
    if (share < 0.02) continue;

    topics.push({
      id: cluster.id,
      name: generateTopicName(cluster.topTerms),
      share,
      keywords: cluster.topTerms,
      trend: calculateTopicTrend(cluster, documents),
    });
  }

  // Sort by share descending
  topics.sort((a, b) => b.share - a.share);

  // Re-assign IDs after sorting
  topics.forEach((t, i) => (t.id = i));

  return topics;
}

/**
 * Check if topic extraction should be skipped (graceful degradation)
 */
export function shouldSkipTopics(questionCount: number): boolean {
  return questionCount < MIN_QUESTIONS_FOR_TOPICS;
}
