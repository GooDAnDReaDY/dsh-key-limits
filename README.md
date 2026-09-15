# 📦 @goodandready/dsh-key-limits

<div align="center">

<h3>Real-time API Quota Limits, Token Plan Balances & Key Monitoring for DeepSeek Harness</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-key-limits"><img src="https://img.shields.io/npm/v/@goodandready/dsh-key-limits.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GooDAnDReaDY/dsh-key-limits.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<!-- Author Showcase Hub -->
<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/All_Author_Projects-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="All Author Projects"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a>
</p>

<!-- Project Support Table -->
<table align="center">
  <tr>
    <td align="center">
      ⭐ <strong>If you like this plugin, please star it on GitHub</strong> — it shows me that the plugin is useful to you and motivates me to keep developing it.
      <br><br>
      🐛 <strong>If you find a bug or would like to request a feature</strong>, open a GitHub issue in any language — I will review your proposal and implement useful suggestions in a future plugin version.
    </td>
  </tr>
</table>

</div>

---

## ⚡ Overview & The Problem

AI developers and engineers frequently work across multiple LLM providers, corporate subscriptions, and token plan tiers simultaneously (such as OpenCode GO, Ollama Cloud, Qwen Cloud, Kimi, GLM, MiniMax, Cline, DeepSeek, OpenRouter, and Command Code). 

Without ambient, real-time quota tracking inside DeepSeek Harness (DSH):
- Conversations crash unexpectedly when rolling 5-hour limits or monthly quotas deplete mid-generation.
- Users have no instant visibility into which subscription key is currently bound to the active chat session.
- Switching tabs to check individual vendor dashboards disrupts developer workflow.

`dsh-key-limits` solves this by delivering ambient, distraction-free quota monitoring directly within the DSH Web UI. It focuses strictly on quota limits and subscription balances without heavy accounting ledgers, historical spending databases, or complex analytics.

---

## 🏗️ Architecture & Data Flow

```mermaid
graph LR
  subgraph Client ["DSH Web Client"]
    FC["FloatChip (Draggable Badge)"]
    CB["ActiveKeyButton (Composer Bar)"]
    SC["Settings Card (Plugin Slot)"]
    M["Modals (All Limits & One Limit)"]
  end

  subgraph Backend ["Cordis Plugin Backend"]
    Router["HTTP API Router (/dsh-key-limits)"]
    CredStore["Encrypted Credential Storage"]
    Updater["Loopback Plugin Updater"]
  end

  subgraph Providers ["AI Providers & Services"]
    P1["OpenCode GO / Ollama / Qwen"]
    P2["Command Code / Cline / GLM"]
    P3["DeepSeek / OpenRouter / MiniMax"]
    NPM["npmjs.org Registry"]
  end

  FC -->|Click| M
  CB -->|Click| M
  M -->|Poll Quotas (60s)| Router
  SC -->|Save Credentials| Router
  SC -->|Trigger Update| Updater
  Router --> CredStore
  Router -->|Parallel 12s Abort| P1
  Router -->|Parallel 12s Abort| P2
  Router -->|Parallel 12s Abort| P3
  Updater -->|Loopback Check / Install| NPM
```

---

## ✨ Full Feature Breakdown

### 1. Floating Quota Chip (`FloatChip`)
- **Persistent Viewport Overlay**: Displays the lowest remaining quota percentage across all active keys (or total account count).
- **Draggable with Boundary Clamping**: Smooth mouse and touch dragging that prevents the chip from leaving the visible screen. Coordinates persist automatically in `localStorage`.
- **One-Click Overview**: Clicking the chip opens the **All Limits Modal** showing every configured account, plan, rolling windows, and expiration dates.

### 2. Composer Bar Key Status (`ActiveKeyButton`)
- Injected directly into the message input area (`conversation.composer.bar`, priority 10).
- Automatically inspects the active conversation session to detect the bound provider model.
- Shows the remaining quota percentage or monetary balance for that exact model.
- Clicking the button opens the **One Limit Modal** dedicated to the active account.

### 3. Account Reordering & Active on Top
- **Custom Account Order (`order`)**: In settings, arrange the display sequence of accounts using intuitive Up/Down controls (▲ / ▼).
- **Active Always on Top (`activeOnTop`)**: Automatically moves the account currently in use by the active conversation to the top of the list. Enabled by default.

### 4. Humanized Reset Countdown (`fmtReset`)
- Durations exceeding 24 hours display days, hours, and minutes (e.g., `5d 5h 19m`).
- Durations under 24 hours omit days for concise reading (e.g., `4h 59m`).
- Expired windows immediately indicate refresh status.

### 5. Calm, Professional UI Design
- Consistent 12px vertical spacing between cards eliminates cramped layouts and overlapping borders.
- Calm neutral tones for healthy (>30%) quota states, reserving amber and red strictly for warning (<30%) and critical (<15%) levels.
- Sleek 5px progress bars that blend into the native DSH theme.

### 6. Built-in One-Click Updater
- Check for updates directly within the settings card.
- Installs the exact published package from npm without manual terminal intervention.
- Protected against non-loopback or cross-origin requests.

---

## 🔌 Supported Providers

| Provider ID | Name | Quota Windows | Authentication |
|-------------|------|---------------|----------------|
| `commandcode` | Command Code | Rolling 5h / Weekly / Monthly (GOAT, Pro, Max plans) | API key (`user_...` or token) |
| `opencode-go` | OpenCode GO | Rolling 5h / Weekly / Monthly | Session cookie (`auth`) & Workspace ID |
| `ollama` | Ollama Cloud | Session / Weekly / Monthly | API key & Session cookie |
| `qwen` | Qwen Cloud | 5h / 1-Week Token Plans | Session cookie & optional `sec_token` |
| `kimi` | Kimi for Coding | Weekly Quota Limit | API key (`sk-kimi-...`) |
| `glm` | GLM (Z.ai) | Daily / Monthly Quota | API key |
| `minimax` | MiniMax Coding Plan | Coding Plan Quota | API key (`sk-cp-...`) |
| `cline` | Cline | 5h / Weekly / Monthly | Bearer API token |
| `deepseek` | DeepSeek | Balance ($ / ¥) | API key (`sk-...`) |
| `openrouter` | OpenRouter | Balance ($ credits remaining) | API key (`sk-or-...`) |

---

## 📦 Quick Installation

Install the official package into your active DSH profile:

```bash
dsh plugin --profile web add @goodandready/dsh-key-limits
```

Restart DSH Web:

```bash
dsh web --profile web
```

---

## ⚙️ Configuration Reference (`settings.yaml`)

```yaml
# ~/.dsh/profiles/web/settings.yaml
plugins:
  '@goodandready/dsh-key-limits':
    storageDir: ~/.dsh/storages/dsh-key-limits
    refreshIntervalMs: 60000
    activeOnTop: true
    order: []
```

### Parameter Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `storageDir` | `string` | `~/.dsh/storages/dsh-key-limits` | Directory where subscription metadata and cached cards are stored. |
| `refreshIntervalMs` | `number` | `60000` (1 min) | Polling frequency for refreshing quota windows from providers. |
| `activeOnTop` | `boolean` | `true` | Automatically pins the account matching the active chat session to the top of lists. |
| `order` | `string[]` | `[]` | User-defined sequence of subscription IDs for custom card ordering. |

---

## 🛠️ Development & Testing

```bash
# Build unified client bundle from src/client/
npm run build:client

# Run automated tests
npm test
```

### Directory Structure

```
.
├── lib/
│   ├── index.js          # Cordis plugin entrypoint & HTTP routes
│   ├── client.js         # Built client bundle
│   ├── cards.js          # Card generation and formatting
│   ├── subs.js           # Provider quota fetchers & normalization
│   ├── paths.js          # Path resolution helpers
│   └── plugin-updater.js # Secure loopback updater
├── src/client/           # Source modules for browser client
│   ├── 01-prelude.js     # Scoped CSS & React setup
│   ├── 02-locale.js      # Multi-language dictionaries (en, zh, ru)
│   ├── 03-format.js      # Humanized countdowns & color classes
│   ├── 04-modals.js      # AllLimitsModal & OneLimitModal
│   ├── 05-bar.js         # Composer bar ActiveKeyButton
│   ├── 06-float.js       # Draggable FloatChip
│   ├── 07-settings.js    # Settings card, reorder list & updater
│   └── 08-apply.js       # DSH plugin bootstrap & slot registrations
├── cordis.patch.yml      # Cordis plugin declaration
└── test/                 # Test suite
```

---

## 📄 License

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)

