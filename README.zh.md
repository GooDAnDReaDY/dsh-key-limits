# @goodandready-private/dsh-key-limits

DeepSeek Harness (DSH) Web 插件：实时监控各 AI 服务商的 API 密钥配额、Token 计划与订阅余额。

[English Documentation (README.md)](./README.md) | [Русская документация (README.ru.md)](./README.ru.md)

---

## 概述

`dsh-key-limits` 专为 DSH Web 工作区设计，提供轻量、专注的配额与余额监控体验。本插件专注于核心限额与余额状态展示，不引入复杂的账本明细、历史支出统计或繁琐的图表分析。

### 核心特性

- **悬浮监控胶囊 (`FloatChip`)**：可自由拖拽并记忆位置的状态胶囊，显示全部订阅的最紧缺额度百分比或活跃密钥数量，具备视口边缘保护（防止拖出屏幕外）。
- **输入栏集成 (`ActiveKeyButton`)**：嵌入 `conversation.composer.bar`（优先级 10），实时展示当前会话所绑定的模型对应订阅额度或余额。
- **设置中心卡片 (`KeyLimitsPluginCard`)**：遵循规范的折叠式设置卡片，位于 `设置 → 插件`，支持管理凭证、调整刷新频率及一键检查/触发更新。
- **高可用后台轮询**：外部请求自带 12 秒超时中断 (`AbortSignal.timeout`)，网络抖动时平滑降级（`stale` 标识），存储写入采用原子操作（`.tmp` + 原子重命名）。
- **一键更新机制**：内置安全的本地回环（Loopback-only）更新器，支持在设置面板中直接一键升级。

---

## 用户界面

| 界面位置 | 展示形式 | 交互与功能 |
|---------|---------|-----------|
| **悬浮胶囊** | 网页固定悬浮窗 | 展示所有密钥中最低的剩余百分比或密钥总数。支持自由拖拽（位置保存在 `localStorage`）。点击打开**全部限额详情弹窗**。 |
| **输入栏按钮** | 对话输入栏 (`conversation.composer.bar`) | 展示当前对话活跃模型的剩余额度或余额。点击打开**当前密钥详情弹窗**。 |
| **设置卡片** | `设置 → 插件 → 密钥额度` | 集中管理数据存储目录、刷新周期、新增/刷新/删除服务商凭据，并支持一键更新。 |

---

## 支持的服务商

| 服务商 ID | 名称 | 配额类型 | 鉴权方式 |
|-----------|------|---------|---------|
| `opencode-go` | OpenCode GO | 滚动 5小时 / 周 / 月 | 会话 Cookie (`auth`) 与 Workspace ID |
| `ollama` | Ollama Cloud | 会话 / 周 / 月 | API Key 与 会话 Cookie |
| `qwen` | 通义千问 (Qwen Cloud) | 5小时 / 1周 Token Plan | 会话 Cookie 与可选 `sec_token` |
| `kimi` | Kimi for Coding | 每周调用额度 | API Key (`sk-kimi-...`) |
| `glm` | 智谱清言 (GLM / Z.ai) | 每日 / 每月额度 | API Key |
| `minimax` | MiniMax Coding Plan | 编程计划调用配额 | API Key (`sk-cp-...`) |
| `cline` | Cline | 5小时 / 周 / 月 | Bearer API Token |
| `deepseek` | DeepSeek | 账户余额 ($ / ¥) | API Key (`sk-...`) |
| `openrouter` | OpenRouter | 账户余额 ($ credits) | API Key (`sk-or-...`) |

---

## 架构与存储设计

### 存储结构

数据默认持久化于本地 `~/.dsh/storages/dsh-key-limits/`：
- `subs.json`：存放已配置的订阅元信息与额度缓存。明文敏感信息由 DSH credentials 核心服务妥善加密托管，`subs.json` 仅保留关联的 `credentialRef`。
- 原子写入：所有写入操作均先生成独立临时文件，再通过 `renameSync` 进行原子置换，彻底杜绝意外断电或进程中断导致的数据损坏。

### 样式隔离

插件采用标准 DSH 插件样式隔离规范：
```html
<style data-dsh-plugin="dsh-key-limits">
  /* 仅对本插件生效的样式规则 */
</style>
```
当插件卸载或重新激活时，样式标签通过 `ctx.effect` 自动清理，不污染宿主全局样式。

---

## 安装说明

通过 DSH 命令行安装经审核批准的正式版本：

```bash
dsh plugin --profile web add @goodandready-private/dsh-key-limits@0.1.6
```

> **注意**：生产环境必须通过私有包管理器安装已发布的版本包，切勿直接链接或挂载本地开发工作树。

---

## 开发指南

在开发环境中执行以下构建与验证命令：

```bash
# 从 src/client/ 打包合并客户端脚本至 lib/client.js
npm run build:client

# 运行全量自动化单元测试
npm test
```

---

## 许可证

MIT © GoodAndReady
