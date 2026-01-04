# Data Model: Year-Pack Generator

**Feature**: 002-year-pack-generator
**Date**: 2026-01-04

## Overview

The Year-Pack Generator produces a structured JSON output (`YearPack`) containing sanitized statistics, keywords, topics, and samples from a year's worth of chat history. This document defines all entities and their relationships.

---

## Core Entities

### YearPack (Root Entity)

The complete output structure returned by the MCP tool.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| meta | YearPackMeta | Yes | Generation metadata |
| stats | YearPackStats | Yes | Statistical summary |
| lengthBuckets | LengthBuckets | Yes | Question length distribution |
| keywords | YearPackKeywords | Yes | Keyword analysis results |
| topics | Topic[] | No* | Extracted topics (empty if <50 questions) |
| samples | YearPackSamples | Yes | Sanitized sample questions |
| safety | YearPackSafety | Yes | Safety/filter metadata |
| notes | string[] | Yes | Contextual notes for LLM |

*Topics array is empty when graceful degradation triggers (<50 questions).

---

### YearPackMeta

Metadata about the generation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| year | number | Yes | Calendar year analyzed (e.g., 2025) |
| language | "en" \| "zh" | Yes | Report language preference |
| generatedAt | string | Yes | ISO 8601 timestamp |
| workspace | string \| null | Yes | Workspace filter if applied |
| questionCount | number | Yes | Total questions analyzed |
| sessionCount | number | Yes | Total sessions analyzed |

---

### YearPackStats

Statistical summary of chat activity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| totalQuestions | number | Yes | Total user questions in year |
| activeMonths | number | Yes | Months with ≥1 question (1-12) |
| monthlyDistribution | MonthlyCount | Yes | Questions per month |

**MonthlyCount**: `Record<string, number>` where key is "YYYY-MM" format.

Example:
```json
{
  "2025-01": 80,
  "2025-02": 95,
  "2025-03": 140
}
```

---

### LengthBuckets

Distribution of question lengths.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| short | number | Yes | Questions 0-100 chars |
| medium | number | Yes | Questions 101-280 chars |
| long | number | Yes | Questions 281+ chars |

---

### YearPackKeywords

Keyword frequency analysis.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| topUnigrams | KeywordItem[] | Yes | Top single words (max 50) |
| topBigrams | KeywordItem[] | Yes | Top word pairs (max 30) |

---

### KeywordItem

A term with its frequency.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| term | string | Yes | The word or phrase |
| count | number | Yes | Occurrence count |

---

### Topic

A thematic cluster extracted via TF-IDF + K-Means.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Topic index (0-based) |
| name | string | Yes | Auto-generated topic name |
| share | number | Yes | Proportion of total (0.0-1.0) |
| keywords | string[] | Yes | Top 5 keywords for this topic |
| trend | TopicTrend | Yes | Trend across year periods |

---

### TopicTrend

Topic distribution across year periods.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| early | number | Yes | Share in Jan-Apr (0.0-1.0) |
| mid | number | Yes | Share in May-Aug (0.0-1.0) |
| late | number | Yes | Share in Sep-Dec (0.0-1.0) |

---

### YearPackSamples

Sanitized sample questions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| questions | string[] | Yes | Sample questions (max 30) |
| maxLength | number | Yes | Max chars per sample (e.g., 120) |

---

### YearPackSafety

Safety metadata documenting applied filters.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| filtersApplied | string[] | Yes | List of sanitization filters |
| guarantees | string[] | Yes | Safety guarantees |

**Standard filtersApplied values**:
- `"user_messages_only"`
- `"code_blocks_removed"`
- `"commands_removed"`
- `"paths_masked"`
- `"urls_masked"`
- `"emails_masked"`
- `"ips_masked"`
- `"secrets_masked"`
- `"truncated_long_text"`

**Standard guarantees values**:
- `"no_executable_content"`
- `"no_file_paths"`
- `"no_urls"`
- `"no_credentials"`

---

## Input Configuration

### YearPackConfig

Tool input parameters.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| year | number | No | Current year | Calendar year to analyze |
| language | "en" \| "zh" | No | "en" | Report language |
| workspace | string | No | null | Filter by workspace path |
| maxSamples | number | No | 30 | Max sample questions |
| maxSampleLength | number | No | 120 | Max chars per sample |
| topicsCount | number | No | 7 | Number of topics to extract |

---

## Output Structure

### Tool Response

The MCP tool returns two parts:

```typescript
interface YearPackResponse {
  yearPack: YearPack;      // Structured data
  promptTemplate: string;   // LLM prompt for report generation
}
```

The `promptTemplate` is a complete prompt that:
1. Instructs the LLM to generate a narrative report
2. Defines 9 sections with field allowlists
3. Specifies language and tone
4. Includes the year_pack as embedded JSON

---

## Validation Rules

### From Functional Requirements

| Rule | Source | Validation |
|------|--------|------------|
| Year in valid range | FR-001 | 1970 ≤ year ≤ current year |
| Language enum | FR-003 | "en" or "zh" only |
| Topics skip if <50 | FR-028 | topics = [] when totalQuestions < 50 |
| Sample length | FR-030 | Each sample ≤ maxSampleLength |
| Sample count | FR-029 | samples.questions.length ≤ maxSamples |

---

## State Transitions

This feature has no persistent state. Each invocation:
1. Reads chat history (read-only)
2. Processes in memory
3. Returns structured output
4. No side effects

---

## Relationships

```
YearPack (1)
├── meta (1)
├── stats (1)
│   └── monthlyDistribution (12 max entries)
├── lengthBuckets (1)
├── keywords (1)
│   ├── topUnigrams (50 max)
│   └── topBigrams (30 max)
├── topics (0-10)
│   └── trend (1 per topic)
├── samples (1)
│   └── questions (30 max)
├── safety (1)
└── notes (0+)
```

---

## Example Output

```json
{
  "meta": {
    "year": 2025,
    "language": "en",
    "generatedAt": "2026-01-04T10:30:00Z",
    "workspace": null,
    "questionCount": 15420,
    "sessionCount": 890
  },
  "stats": {
    "totalQuestions": 15420,
    "activeMonths": 11,
    "monthlyDistribution": {
      "2025-01": 980,
      "2025-02": 1120,
      "2025-03": 1450
    }
  },
  "lengthBuckets": {
    "short": 8200,
    "medium": 5800,
    "long": 1420
  },
  "keywords": {
    "topUnigrams": [
      { "term": "api", "count": 342 },
      { "term": "error", "count": 289 }
    ],
    "topBigrams": [
      { "term": "how to", "count": 156 },
      { "term": "does not", "count": 98 }
    ]
  },
  "topics": [
    {
      "id": 0,
      "name": "API Development",
      "share": 0.23,
      "keywords": ["api", "endpoint", "rest", "request", "response"],
      "trend": { "early": 0.18, "mid": 0.25, "late": 0.28 }
    }
  ],
  "samples": {
    "questions": [
      "How do I handle async errors in TypeScript?",
      "What is the difference between REST and GraphQL?"
    ],
    "maxLength": 120
  },
  "safety": {
    "filtersApplied": [
      "user_messages_only",
      "code_blocks_removed",
      "paths_masked"
    ],
    "guarantees": [
      "no_executable_content",
      "no_file_paths"
    ]
  },
  "notes": [
    "Data is aggregated for entertainment purposes.",
    "Topic trends indicate focus shifts, not exact timelines."
  ]
}
```
