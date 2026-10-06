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

### 6. Pool Health & Predictive Analytics
- **Pool Health Indicator**: Ambient breakdown of provider account pools (`healthy / warning / exhausted`), immediately surfacing accounts experiencing quota exhaustion or upstream timeouts.
- **Burn Rate & Velocity**: Real-time hourly consumption speed tracking (`%/h`) and automatic time-to-depletion projection (`~X.X h left`) derived from 24-hour rolling browser usage snapshots.
- **Ambient Reset Countdown**: Floating chip tooltip and account tags display humanized countdown timers to the nearest quota reset window (e.g., `Resets in 2h 15m`).
### 7. Docked Mode, Hotkey & Low-Quota Alerts
- **Docked Mode**: One-click pin button in the floating chip docks it neatly into the bottom-right corner, locking movement and saving window space.
- **Global Hotkey `Alt+K`**: Instant access to the Limits Hub from any view or workflow without reaching for the mouse.
- **Danger Toast Warning**: Ambient alert appears when the active key dips below 15% quota, preventing surprise generation cutoffs.

### 8. Encrypted Backup & Batch Refresh
- **Encrypted Export & Import**: Export all configured keys and subscriptions into a password-protected AES-256-GCM encrypted backup file for easy migration between devices or profiles.
- **Refresh All**: One-click forced quota refresh in the Limits Hub with spinning progress animation and concurrency-limited batch querying.

### 9. Built-in One-Click Updater
- Check for updates directly within the settings card.
- Installs the exact published package from npm without manual terminal intervention.
- Protected against non-loopback or cross-origin requests.

### 10. Security & Storage Architecture
- **Isolated Secret Persistence**: Plaintext API keys and sensitive session cookies (e.g. Ollama Cloud) are stored exclusively in the host DSH `credentials` service. The local `subs.json` file only contains non-sensitive metadata and references.
- **Strict File Permissions**: The `subs.json` database and temporary swap files are enforced with strict POSIX `0600` file modes, preventing multi-user local inspection.
- **Fail-Closed Memory Hygiene**: The in-memory cache purges sensitive secrets before resolving, ensuring revoked or deleted credentials do not persist in background polling or leak into backup exports.
- **Redirect Protection**: Provider API fetchers enforce `redirect: 'error'`, preventing sensitive authorization headers (`x-api-key`, Bearer tokens) from leaking cross-origin across HTTP 301/302/307 redirects.
- **Transactional Persistence**: Disk write failures automatically roll back in-memory state and return standard HTTP 500 responses rather than reporting false success.

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
| `siliconflow` | SiliconFlow (SiliconCloud) | Total Balance / Credits ($ / ¥) | API key (`sk-...`) |
| `anthropic` | Anthropic | Requests / Tokens Rate Limits | API key (`sk-ant-...`) |
| `groq` | Groq | RPM & TPM Rate Limits | API key (`gsk_...`) |
| `gemini` | Google Gemini | API Status / Model Quota | API key (`AIza...`) |
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
    refreshHours: 24
    ui:
      floatChip: true
      composerBar: true
      activeOnTop: true
      order: []
```

### Parameter Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `storageDir` | `string` | `~/.dsh/storages/dsh-key-limits` | Directory where subscription metadata and cached cards are stored (read-only in UI, configured in settings.yaml, requires restart). |
| `refreshHours` | `number` | `24` | Background polling interval in hours for refreshing quota windows from providers. |
| `ui.floatChip` | `boolean` | `true` | Show floating draggable indicator chip in the viewport. |
| `ui.composerBar` | `boolean` | `true` | Show active key button in the chat composer bar. |
| `ui.activeOnTop` | `boolean` | `true` | Automatically pin the account matching the active chat session to the top of lists. |
| `ui.order` | `string[]` | `[]` | User-defined sequence of subscription IDs for custom card ordering. |

---

## 🌐 REST API Endpoints

| Method & Path | Access / Origin | Description |
|---------------|-----------------|-------------|
| `GET /dsh-key-limits/health` | Public / Web | Service health check and subscription summary |
| `GET /dsh-key-limits/config` | Public / Web | Public UI configuration and provider input schemas |
| `GET /dsh-key-limits/active-sub` | Public / Web | Active session subscription binding (`?sessionId=<id>`) |
| `GET /dsh-key-limits/subs` | Public / Web | List of all configured subscriptions, cards, and balances |
| `POST /dsh-key-limits/subs` | Loopback / Same-Origin | Add, edit, or delete a subscription |
| `POST /dsh-key-limits/refresh-all` | Loopback / Same-Origin | Force refresh all subscriptions (concurrent refresh lock) |
| `POST /dsh-key-limits/export` | Loopback / Same-Origin | Export subscriptions encrypted with passphrase (AES-256-GCM) |
| `POST /dsh-key-limits/import` | Loopback / Same-Origin | Decrypt and import subscription backup with deduplication |
| `GET /dsh-key-limits/update` | Loopback / Same-Origin | Check npm registry for newer plugin versions |
| `POST /dsh-key-limits/update` | Loopback / Same-Origin | Apply plugin update via internal npm runner |

---

## 🛠️ Development & Testing

> **Note**: The published npm package and release tarball carry only runtime production files (`lib/`, `cordis.patch.yml`, docs, and license). Development sources (`src/client/`, `test/`, and build scripts) are maintained in the source repository. To run automated tests or rebuild the client bundle, clone the development repository.

```bash
# Build unified client bundle from src/client/ into lib/client.js
npm run build:client

# Run automated offline test suite
npm test
```

### Directory Structure

```
.
├── lib/
│   ├── index.js                  # Cordis plugin entrypoint & HTTP routes
│   ├── client.js                 # Built client bundle
│   ├── cards.js                  # Card generation and formatting
│   ├── subs.js                   # Provider quota manager & normalization
│   ├── provider-fetchers.js       # Core quota fetchers & HTML parsers
│   ├── provider-extra-fetchers.js # Extended quota fetchers (SiliconFlow, Anthropic, Groq, Gemini)
│   ├── crypto-backup.js          # AES-256-GCM passphrase export & import
│   ├── paths.js                  # Path resolution helpers
│   └── plugin-updater.js         # Secure loopback updater
├── src/client/                   # Source modules for browser client
│   ├── 01-prelude.js             # Scoped CSS & React setup
│   ├── 02-locale.js              # Multi-language dictionaries (en, zh; ru via dsh-russian-lang)
│   ├── 03-format.js              # Humanized countdowns & color classes
│   ├── 04-modals.js              # AllLimitsModal & OneLimitModal
│   ├── 05-bar.js                 # Composer bar ActiveKeyButton
│   ├── 06-float.js               # Draggable FloatChip
│   ├── 07-settings.js            # Settings card, reorder list & updater
│   └── 08-apply.js               # DSH plugin bootstrap & slot registrations
├── cordis.patch.yml              # Cordis plugin declaration
└── test/                         # Test suite
```

---

## 📄 License

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)

