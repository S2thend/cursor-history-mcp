# Research: Year-Pack Generator NLP Approach

**Date**: 2026-01-04
**Purpose**: Resolve NEEDS CLARIFICATION items from Technical Context

## Research Questions

1. TF-IDF implementation: Pure JS vs library
2. K-Means clustering: Pure JS vs library
3. Tokenization: Pure regex vs library

## Constraint Reminder

Per spec clarifications, library selection priority:
1. **Compatibility** (ESM + TypeScript + Node 20+) - FIRST
2. **Speed** (performance for ~20k questions)
3. **Accuracy** (acceptable for entertainment use case)

---

## Library Analysis

### Option A: wink-nlp + ml-kmeans + Custom TF-IDF

| Aspect | wink-nlp | ml-kmeans |
|--------|----------|-----------|
| ESM Support | Partial (works with bundler) | Dual module (CJS + ESM) |
| TypeScript | Built-in types | Built-in types |
| Node 20+ | ✅ Compatible | ✅ Compatible |
| Last Published | Active | 25 days ago |
| Dependencies | Zero | 3 (ml-distance, ml-matrix, ml-nearest-vector) |
| Speed | 650k+ tokens/sec | Fast for small datasets |

**Verdict**: Good compatibility but missing TF-IDF (must implement yourself).

### Option B: natural + ml-kmeans

| Aspect | natural | ml-kmeans |
|--------|---------|-----------|
| ESM Support | ⚠️ CommonJS-first | Dual module |
| TypeScript | Built-in types | Built-in types |
| Node 20+ | ✅ | ✅ |
| TF-IDF | Built-in | N/A |
| K-Means | N/A | Built-in |

**Verdict**: CommonJS friction with pure ESM project - compatibility concern.

### Option C: Pure JavaScript Implementation (RECOMMENDED)

| Aspect | Status |
|--------|--------|
| ESM Support | ✅ Perfect (you write it) |
| TypeScript | ✅ Native |
| Node 20+ | ✅ Guaranteed |
| Dependencies | Zero |
| Bundle Size | ~200 lines of code |
| Maintenance | None (no deps to update) |

---

## Decision: Pure JavaScript Implementation

### Rationale

1. **Compatibility is FIRST priority** - Pure TS guarantees ESM + strict mode compatibility
2. **Dataset is small** - 52 weekly-aggregated documents, not industrial scale
3. **Entertainment use case** - Accuracy requirements are relaxed
4. **Performance easily achievable** - Modern JS on Node 20+ handles 20k strings trivially
5. **Zero dependency risk** - No breaking changes, no CommonJS/ESM friction

### Implementation Scope

| Component | Lines | Complexity |
|-----------|-------|------------|
| Tokenizer (regex) | ~30 | Simple |
| Stopwords (en/zh) | ~100 | Data only |
| TF-IDF | ~80 | Medium |
| K-Means | ~120 | Medium |
| **Total** | ~330 | Manageable |

### Algorithm Choices

**Tokenization**:
- Regex-based word extraction
- Lowercase normalization
- Filter tokens < 3 chars
- Support alphanumeric + common tech symbols

**TF-IDF**:
- Standard formula: `tf * log(N / df)`
- Document = weekly aggregation of questions
- Skip terms below minDf threshold
- Skip terms above maxDfRatio threshold

**K-Means**:
- Initialize with k-means++ (better convergence)
- Fixed iterations (20-30) sufficient for 52 documents
- Euclidean distance on TF-IDF vectors
- Sparse representation (only store non-zero terms)

### Alternatives Considered

| Library | Why Rejected |
|---------|--------------|
| natural | CommonJS-first, ESM friction |
| tiny-tfidf | Inactive (6 years), no TypeScript |
| ml-tfidf | Would still need separate K-Means |
| wink-nlp | Still needs TF-IDF implementation |

### Risk Mitigation

- If pure JS too slow: Profile first, then consider `ml-kmeans` (good ESM support)
- If accuracy insufficient: Can upgrade to library post-MVP
- If implementation bugs: Well-tested algorithms, extensive unit tests planned

---

## Resolved Decisions

| Item | Decision |
|------|----------|
| TF-IDF implementation | Pure TypeScript |
| K-Means clustering | Pure TypeScript |
| Tokenization | Pure regex |
| External NLP libs | None (zero dependencies) |

## Next Steps

- Phase 1: Define data model (YearPack schema)
- Phase 1: Define MCP tool contract
- Phase 2: Implement in order: tokenizer → stopwords → analyzer → topics → prompt
