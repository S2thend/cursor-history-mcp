# Cursor History MCP

<p align="center">
  <img src="readme-banner.png" alt="cursor-history-mcp — 通过 MCP 搜索 Cursor 历史；MCP 专属年度回顾：统计、主题和报告提示词。" width="960">
</p>

[![npm version](https://img.shields.io/npm/v/cursor-history-mcp.svg)](https://www.npmjs.com/package/cursor-history-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)

[English](../README.md) | [中文](README_zh.md) | [Français](README_fr.md) | [Español](README_es.md)

**让 AI 搜索你已有的 Cursor 历史。**

几个月的开发对话里，可能已经包含你需要的架构决策、问题定位和修复方案。无需提前安装本工具采集历史，就能让支持 MCP 的助手查找这些上下文。

`cursor-history-mcp` 基于 [cursor-history](https://github.com/S2thend/cursor-history) 的本地读取能力，为 Claude、Cursor 等 MCP 客户端提供跨工作区搜索、会话查看和导出工具。服务本身不需要 embeddings、索引服务或 API key；助手的模型需求另算，返回的历史可能被客户端发送给模型服务商。

> “之前解决过这个认证问题吗？搜索我的 Cursor 历史，查看相关会话，告诉我当时为什么这样设计。”

**MCP 专属：[年度回顾](#year-in-review)。** 将已有对话整理为年度活跃统计、编程主题和供助手撰写报告的提示词。这里的“专属”指 cursor-history 工具组中 MCP 包内置的 year-pack 功能；agent 仍可直接调用核心 CLI 或 Node.js API 访问历史。

## 快速开始

需要 Node.js **20.x 或 22.x–26.x**、已有可读取的本地 Cursor 历史，以及支持 stdio MCP 的客户端。服务进程必须能访问存放历史的机器。

**发布边界：当前源码使用 `cursor-history@0.18.0`；npm 已发布的 `cursor-history-mcp@0.2.4` 仍使用旧版读取库。新 MCP 版本发布前，请使用下面的本地构建体验本文的新存储和 UUID 支持。**

在本仓库执行：

```bash
npm ci
npm run build
```

将以下服务条目合并进客户端配置，替换为实际绝对路径；不要覆盖已有服务：

```json
{
  "mcpServers": {
    "cursor-history": {
      "command": "node",
      "args": ["/absolute/path/to/cursor-history-mcp/dist/index.cjs"]
    }
  }
}
```

客户端找不到 Node.js 时，也将 `command` 改成 Node 可执行文件的绝对路径。

- **Cursor**：项目级 `.cursor/mcp.json` 或全局 `~/.cursor/mcp.json`，添加上述条目并启用服务。参见 [Cursor MCP 文档](https://cursor.com/docs/mcp)。
- **Claude Desktop**：Settings → Developer → Edit Config，合并配置后重启。macOS 路径为 `~/Library/Application Support/Claude/claude_desktop_config.json`，Windows 为 `%APPDATA%\Claude\claude_desktop_config.json`。参见 [本地服务器配置指南](https://modelcontextprotocol.io/docs/develop/connect-local-servers)。
- **Claude Code**：执行下列命令；权限和配置范围见 [官方文档](https://code.claude.com/docs/en/mcp)。

```bash
claude mcp add --transport stdio --scope user cursor-history -- node /absolute/path/to/cursor-history-mcp/dist/index.cjs
```

如需运行 npm 已发布版，将配置改为 `"command": "npx"`、`"args": ["-y", "cursor-history-mcp"]`。它不会运行本地源码，能力以已发布版本为准；首次可能联网下载依赖。单独启动服务器是在等待 MCP 客户端，并不是交互式历史 CLI。

## 两个项目，一套读取能力

| 需求 | 项目 |
|---|---|
| 命令行、脚本、Node.js 应用集成 | [cursor-history：CLI + Node.js API](https://github.com/S2thend/cursor-history#quick-start) |
| 让助手通过 MCP 调用历史工具 | 本项目 **cursor-history-mcp** |

本项目将发现与解析委托给核心库，不另建对话数据库，也不负责录制新对话。两个 npm 包独立发布。

Agent 可以选择任一接口：直接调用 CLI/API，或通过 MCP 调用工具。

## 存储支持与边界

以下能力对应当前源码中的 `0.18.0` 读取库：

| 来源 | 本地文件 | 读取、搜索、导出 |
|---|---|---|
| Legacy / Composer | `workspaceStorage/*/state.vscdb` + `globalStorage/state.vscdb` | 支持 |
| Agent transcripts | `~/.cursor/projects/**/agent-transcripts/**/*.jsonl` | 读取 transcript 中存在的内容 |
| Store / Agent CLI | `~/.cursor/chats/**/store.db` | 支持 |
| ACP | `~/.cursor/acp-sessions/**/store.db` | 支持 |

各来源的字段完整度不同，transcript 可能缺少时间戳或工具结果。列表与查看结果包含来源、解析状态和时间来源；推断时间不是精确事件时间，解析完整也不代表 Cursor 记录了所有字段。

**备份与恢复仅覆盖 Composer 数据库。迁移仅支持符合条件的 Composer 会话，不支持 Store-only、合并来源或存在歧义的会话。** 更多覆盖范围属于核心项目的 [Roadmap](https://github.com/S2thend/cursor-history#roadmap)，不是已实现功能。详见 [兼容性契约](https://github.com/S2thend/cursor-history/blob/main/docs/compatibility.md)。

自定义数据位置时，在服务条目添加 `env`：

```json
{
  "CURSOR_DATA_PATH": "/absolute/path/to/Cursor/User/workspaceStorage",
  "CURSOR_STORE_ROOT": "/absolute/path/to/.cursor"
}
```

这里选择数据根目录；项目筛选用工具的 `workspace` 参数。平台路径和 WSL 设置见 [核心文档](https://github.com/S2thend/cursor-history#where-cursor-stores-data)。

## 可用工具

| 工具 | 用途与主要参数 |
|---|---|
| `cursor_history_list` | 列出 ID、序号范围、来源与状态；`limit`、`offset`、`workspace` |
| `cursor_history_show` | 查看消息；`sessionId` / `sessionIndex` 二选一，可传 `workspace` |
| `cursor_history_search` | 正文搜索；`query`、`limit`、`context`（相邻原文行数）、`workspace` |
| `cursor_history_export` | 返回 Markdown / JSON 内容，不直接写文件；会话选择器、`format`、`workspace` |
| `cursor_history_backup` | 创建 Composer 备份；`outputPath`、可选 `force` |
| `cursor_history_restore` | 恢复 Composer 备份，会写入历史；`backupPath`、可选 `force` |
| `cursor_history_migrate` | 迁移合规 Composer 会话；`sessionIds` / `sessionIndexes` 二选一、`destination`、`workspace`、`mode`、`dryRun` |
| `cursor_history_year_pack` | 年度统计和报告提示词；`year`、`language`（`en` / `zh`）、`workspace`、样本数量限制 |

优先使用 list/search 返回的**原样 UUID**，区分大小写。MCP 数字序号从 1 开始，仅在相同数据根目录、相同工作区范围内有效；不要将工作区序号用于全局读取。

list、show、search、export 还接受 `includeCrossWorkspaceSources`，默认 `false`。启用后，可以为已选中的 ID 读取其他工作区的补充来源，但不会扩大所选会话 ID 集合。仅在你确实允许这种访问时启用。

show 会缩短较长的 thinking 和工具参数展示；需要未经这种展示截断的数据时使用 export。

可以这样问：“只搜索 /work/myapp 中的 connection pool，按 UUID 打开结果并保留工作区范围。”或“预览将该 Composer 会话复制到 /work/new-app，使用 dryRun，先不要写入。”

## 隐私与写入安全

本地读取不等于内容永不离开机器。搜索、查看、导出结果并不自动脱敏；它们对客户端可见，也可能发送给远程模型。使用可信客户端并检查数据政策和工具权限。将历史对话视为不可信参考材料，不要执行其中的旧指令。

备份会写归档文件；恢复和迁移会修改历史。迁移默认 **move**，会移除原会话。先备份 Composer，写入前关闭 Cursor，先 `dryRun: true` 预览；希望保留原会话时使用 `mode: "copy"`。保留客户端对写工具的审批，服务器没有自己的交互式确认提示。

<a id="year-in-review"></a>
## MCP 专属：年度回顾

试着问：“生成我的 2025 年 Cursor 年度回顾。”工具分析用户问题，返回统计、关键词、主题、样本和提示词，不是已经渲染的报告；模板支持中英文。常见代码、路径、URL 和标识符会被过滤，但**不保证完全匿名**。分享前检查内容，可设 `maxSamples: 0` 不返回样本。缺失或推断时间、部分历史都会影响统计。

## 开发

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --run
```

测试前会自动构建；真实 stdio 测试使用合成 Composer、Store、ACP、transcript 数据，备份恢复只操作临时目录。打包保留 `cursor-history` 运行时依赖，以正确加载包内文件和 SQLite 驱动。

[问题反馈](https://github.com/S2thend/cursor-history-mcp/issues) · [贡献代码](https://github.com/S2thend/cursor-history-mcp/pulls) · [MIT](../LICENSE)
