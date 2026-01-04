# Quickstart: Year-Pack Generator

**Feature**: 002-year-pack-generator

## Overview

The `cursor_history_year_pack` tool generates a sanitized annual summary of your Cursor AI chat history, suitable for creating entertainment-focused "year in review" reports.

## Basic Usage

### Generate Year Pack for Current Year

```
Tool: cursor_history_year_pack
Input: {}
```

Returns a year_pack JSON with statistics, topics, keywords, and a prompt template for the current year.

### Generate Year Pack for Specific Year

```
Tool: cursor_history_year_pack
Input: { "year": 2025 }
```

### Filter by Workspace

```
Tool: cursor_history_year_pack
Input: {
  "year": 2025,
  "workspace": "/path/to/my-project"
}
```

### Chinese Language Report

```
Tool: cursor_history_year_pack
Input: {
  "year": 2025,
  "language": "zh"
}
```

## Output Structure

The tool returns two parts:

### 1. yearPack (JSON)

```json
{
  "meta": {
    "year": 2025,
    "language": "en",
    "generatedAt": "2026-01-04T10:30:00Z",
    "questionCount": 15420,
    "sessionCount": 890
  },
  "stats": {
    "totalQuestions": 15420,
    "activeMonths": 11,
    "monthlyDistribution": { "2025-01": 980, ... }
  },
  "lengthBuckets": {
    "short": 8200,
    "medium": 5800,
    "long": 1420
  },
  "keywords": {
    "topUnigrams": [{ "term": "api", "count": 342 }, ...],
    "topBigrams": [{ "term": "how to", "count": 156 }, ...]
  },
  "topics": [
    {
      "id": 0,
      "name": "API Development",
      "share": 0.23,
      "keywords": ["api", "endpoint", "rest"],
      "trend": { "early": 0.18, "mid": 0.25, "late": 0.28 }
    }
  ],
  "samples": {
    "questions": ["How do I handle async errors?", ...],
    "maxLength": 120
  },
  "safety": {
    "filtersApplied": ["user_messages_only", "code_blocks_removed"],
    "guarantees": ["no_executable_content", "no_file_paths"]
  }
}
```

### 2. promptTemplate (String)

A complete prompt for generating a narrative report using any LLM. The prompt:
- Defines 9 report sections (Title, Poem, Highlights, Stats, Style, Awards, Archetype, Timeline, Future)
- Specifies which year_pack fields each section can use
- Includes the year_pack as embedded JSON
- Sets language and tone expectations

## Using the Prompt Template

After receiving the tool output:

1. Copy the `promptTemplate` string
2. Send it to any LLM (Claude, GPT, etc.)
3. Receive a formatted annual report

Example flow:
```
User → cursor_history_year_pack → { yearPack, promptTemplate }
User → LLM with promptTemplate → Annual Report Narrative
```

## Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| year | integer | current | Year to analyze |
| language | "en"/"zh" | "en" | Report language |
| workspace | string | null | Filter by workspace |
| maxSamples | integer | 30 | Max sample questions |
| maxSampleLength | integer | 120 | Max chars per sample |
| topicsCount | integer | 7 | Topics to extract |

## Graceful Degradation

- **<50 questions**: Topics array is empty; stats and keywords still returned
- **No sessions for year**: Returns error with helpful message
- **Database locked**: Returns structured MCP error

## Safety Guarantees

All output is sanitized:
- ✅ User messages only (no assistant/tool content)
- ✅ Code blocks removed
- ✅ Shell commands removed
- ✅ File paths masked as `[PATH]`
- ✅ URLs masked as `[URL]`
- ✅ Emails/IPs masked
- ✅ Secrets/tokens masked
- ✅ Long text truncated

## Performance

- Target: <10 seconds for 20,000 questions
- Memory-efficient: Week-based aggregation before analysis
- Read-only: No modifications to chat history

## Error Handling

All errors follow MCP structured error format:
- Database not found
- Database locked
- No sessions for specified year
- Invalid year parameter

## Next Steps

After generating a year pack:
1. Review the `yearPack` data for accuracy
2. Use `promptTemplate` with your preferred LLM
3. Customize the generated report as desired
