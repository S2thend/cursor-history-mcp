/**
 * Prompt template generation for year-pack
 * Creates LLM prompts for generating annual reports
 */

import type { YearPack } from "./types.js";

/**
 * Section allowlists - which year_pack fields each report section can use
 */
const SECTION_ALLOWLISTS = {
  title: ["meta.year", "topics[0..1].name", "keywords.topUnigrams[0..5]"],
  poem: ["topics", "keywords.topUnigrams", "keywords.topBigrams"],
  highlights: [
    "topics (share + trend)",
    "keywords.topBigrams[0..2]",
    "stats.monthlyDistribution",
  ],
  stats: ["stats.*", "lengthBuckets", "keywords (optional)"],
  style: ["lengthBuckets", "keywords", "samples (max 2-3, ≤120 chars)"],
  awards: ["topics", "keywords", "stats"],
  archetype: ["topics.trend", "lengthBuckets", "keywords.topBigrams"],
  timeline: ["stats.monthlyDistribution", "topics.trend"],
  future: ["topics.trend (ascending)", "keywords"],
};

/**
 * Generate English prompt template
 */
export function generateEnglishPrompt(yearPack: YearPack): string {
  const { meta, stats, topics } = yearPack;
  const yearPackJson = JSON.stringify(yearPack, null, 2);

  const hasTopics = topics.length > 0;
  const topTopicNames = topics
    .slice(0, 3)
    .map((t) => t.name)
    .join(", ");

  return `# Year in Review Report Generator

You are generating a personalized, entertainment-focused "Year in Review" report based on the user's AI assistant chat history from ${meta.year}.

## Important Guidelines

1. **Tone**: Fun, insightful, celebratory - like Spotify Wrapped but for coding
2. **Language**: English
3. **Data Source**: Use ONLY the year_pack data provided below
4. **Privacy**: The data has been sanitized. Do not speculate about personal details.
5. **No Fabrication**: Only mention themes/topics that appear in the data

## Report Sections

Generate the following 9 sections in order:

### 1. Title / Cover
Create a catchy title for this year's coding journey.
**Allowed data**: ${SECTION_ALLOWLISTS.title.join(", ")}

### 2. Poem of Reflection
Write a short, creative poem (4-8 lines) capturing the year's themes.
**Allowed data**: ${SECTION_ALLOWLISTS.poem.join(", ")}
**Note**: Do NOT use the samples field for poetry.

### 3. Three Highlights of the Year
Identify 3 standout themes or achievements based on topic trends.
**Allowed data**: ${SECTION_ALLOWLISTS.highlights.join(", ")}

### 4. Chat Stats
Present the key statistics in an engaging way.
**Allowed data**: ${SECTION_ALLOWLISTS.stats.join(", ")}
- Total questions: ${stats.totalQuestions.toLocaleString()}
- Active months: ${stats.activeMonths}
- Most active period: [calculate from monthlyDistribution]

### 5. Conversation Style
Describe the user's questioning style based on length patterns and keywords.
**Allowed data**: ${SECTION_ALLOWLISTS.style.join(", ")}

### 6. Annual Awards
Create 3-5 fun awards based on the data (e.g., "Most Consistent Topic", "Late-Night Coder").
**Allowed data**: ${SECTION_ALLOWLISTS.awards.join(", ")}

### 7. Archetype
Assign a developer archetype (e.g., "The System Architect", "The Bug Hunter", "The Feature Builder").
**Allowed data**: ${SECTION_ALLOWLISTS.archetype.join(", ")}
**Rules**:
- Do NOT mention MBTI or personality types
- Do NOT infer personal attributes
- Base it purely on coding patterns

### 8. Timeline & Inflection Points
Describe how focus shifted across the year (early → mid → late).
**Allowed data**: ${SECTION_ALLOWLISTS.timeline.join(", ")}
${hasTopics ? `Key topics: ${topTopicNames}` : "Note: Topic data unavailable (insufficient data)"}

### 9. Future Surprise Lines
Based on rising trends, suggest what might be next.
**Allowed data**: ${SECTION_ALLOWLISTS.future.join(", ")}

## Year Pack Data

\`\`\`json
${yearPackJson}
\`\`\`

## Output Format

Generate the report with clear section headers (##) and engaging content. Make it feel personal and celebratory while staying grounded in the data provided.

Remember: This is entertainment, not analysis. Have fun with it!`;
}

/**
 * Generate Chinese prompt template
 */
export function generateChinesePrompt(yearPack: YearPack): string {
  const { meta, stats, topics } = yearPack;
  const yearPackJson = JSON.stringify(yearPack, null, 2);

  const hasTopics = topics.length > 0;
  const topTopicNames = topics
    .slice(0, 3)
    .map((t) => t.name)
    .join("、");

  return `# 年度回顾报告生成器

你正在根据用户 ${meta.year} 年的 AI 助手聊天记录，生成一份个性化、娱乐性的"年度回顾"报告。

## 重要指南

1. **语气**：有趣、洞察力强、庆祝性的 - 类似于 Spotify Wrapped，但用于编程
2. **语言**：中文
3. **数据来源**：仅使用下方提供的 year_pack 数据
4. **隐私**：数据已经过脱敏处理。不要推测个人详情。
5. **不要虚构**：只提及数据中出现的主题

## 报告章节

按顺序生成以下 9 个章节：

### 1. 标题 / 封面
为今年的编程之旅创建一个吸引人的标题。
**可用数据**: ${SECTION_ALLOWLISTS.title.join(", ")}

### 2. 年度诗篇
写一首简短的创意诗（4-8行），捕捉今年的主题。
**可用数据**: ${SECTION_ALLOWLISTS.poem.join(", ")}
**注意**：诗歌中不要使用 samples 字段。

### 3. 年度三大亮点
根据主题趋势，识别 3 个突出的主题或成就。
**可用数据**: ${SECTION_ALLOWLISTS.highlights.join(", ")}

### 4. 聊天统计
以有趣的方式呈现关键统计数据。
**可用数据**: ${SECTION_ALLOWLISTS.stats.join(", ")}
- 总问题数：${stats.totalQuestions.toLocaleString()}
- 活跃月份：${stats.activeMonths}
- 最活跃时期：[从 monthlyDistribution 计算]

### 5. 对话风格
根据问题长度模式和关键词描述用户的提问风格。
**可用数据**: ${SECTION_ALLOWLISTS.style.join(", ")}

### 6. 年度奖项
根据数据创建 3-5 个有趣的奖项（例如："最稳定主题奖"、"深夜编程奖"）。
**可用数据**: ${SECTION_ALLOWLISTS.awards.join(", ")}

### 7. 开发者人设
分配一个开发者人设（例如："系统架构师"、"Bug 猎手"、"功能构建者"）。
**可用数据**: ${SECTION_ALLOWLISTS.archetype.join(", ")}
**规则**：
- 不要提及 MBTI 或性格类型
- 不要推断个人属性
- 纯粹基于编程模式

### 8. 时间线与转折点
描述全年焦点的变化（年初 → 年中 → 年末）。
**可用数据**: ${SECTION_ALLOWLISTS.timeline.join(", ")}
${hasTopics ? `主要主题：${topTopicNames}` : "注意：主题数据不可用（数据不足）"}

### 9. 未来展望
根据上升趋势，预测接下来可能的方向。
**可用数据**: ${SECTION_ALLOWLISTS.future.join(", ")}

## Year Pack 数据

\`\`\`json
${yearPackJson}
\`\`\`

## 输出格式

生成带有清晰章节标题（##）和吸引人内容的报告。让它既个性化又有庆祝感，同时保持基于提供的数据。

记住：这是娱乐性报告，不是分析报告。尽情发挥！`;
}

/**
 * Generate prompt template based on language
 */
export function generatePromptTemplate(
  yearPack: YearPack,
  language: "en" | "zh" = "en"
): string {
  return language === "zh"
    ? generateChinesePrompt(yearPack)
    : generateEnglishPrompt(yearPack);
}
