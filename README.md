# @goodandready-private/dsh-key-limits

DeepSeek Harness (DSH) web plugin for real-time quota limits, token plan balances, and subscription monitoring across AI providers.

[中文文档 (README.zh.md)](./README.zh.md) | [Русская документация (README.ru.md)](./README.ru.md)

---

## Overview

`dsh-key-limits` provides lightweight, distraction-free quota and balance tracking directly inside the DSH web workspace. It focuses strictly on quota limits and subscription balances without heavy accounting ledgers, historical spending databases, or complex analytics.

### Key Capabilities

- **Floating Quota Chip (`FloatChip`)**: Draggable, persistent status badge displaying overall subscription health (lowest remaining percentage or active key count) with viewport boundary clamping.
- **Composer Bar Integration (`ActiveKeyButton`)**: Displays the active session's quota or balance directly inside `conversation.composer.bar` (priority 10).
- **Settings Card (`KeyLimitsPluginCard`)**: Standard collapsible card under `Settings → Plugins` for managing credentials, adjusting intervals, and checking/triggering one-click updates.
- **Resilient Background Polling**: Automatic polling with 12-second abort timeouts, graceful error degradation (`stale` markers), and atomic file persistence (`.tmp` + atomic rename).
- **One-Click Updater**: Secure loopback updater enabling instant status checks and upgrades directly from the DSH web UI.

---

## User Surfaces

| Surface | Placement | Interaction & Behavior |
|---------|-----------|------------------------|
| **Floating Chip** | Fixed viewport overlay | Displays lowest remaining quota % or key count. Drag to reposition (saved in `localStorage`). Click opens **All Limits Modal**. |
| **Composer Bar Button** | Message input bar (`conversation.composer.bar`) | Displays remaining % or balance for the model bound to the active conversation. Click opens **One Limit Modal**. |
| **Settings Card** | `Settings → Plugins → Key Limits` | Collapsible card to configure storage directory, refresh frequency, add/edit/delete provider credentials, and check for updates. |

---

## Supported Providers

| Provider ID | Name | Quota Type | Authentication |
|-------------|------|------------|----------------|
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

## Architecture & Storage

### Storage Layout

Data is stored locally under `~/.dsh/storages/dsh-key-limits/`:
- `subs.json`: Subscriptions registry and cached quota cards. Plaintext secrets are managed through the DSH credentials service; `subs.json` retains only `credentialRef` tokens.
- Atomic writes: All writes to `subs.json` are performed via unique temporary files and atomic `renameSync`, completely preventing file corruption during sudden restarts.

### Style Isolation

All client styles are dynamically attached with standard DSH plugin isolation:
```html
<style data-dsh-plugin="dsh-key-limits">
  /* scoped css */
</style>
```
Styles are automatically cleaned up when the plugin is deactivated or unmounted.

---

## Installation

Install the published package at the exact version approved for deployment:

```bash
dsh plugin --profile web add @goodandready-private/dsh-key-limits@0.1.6
```

> **Important**: Production must use the published package from the configured registry. Do not link or install directly from a development worktree.

---

## Development

Clone or open the worktree in your environment:

```bash
# Build unified client bundle from src/client/
npm run build:client

# Run automated tests
npm test
```

### Client File Organization

```
src/client/
├── 01-prelude.js   # Styles, constants, and React/DOM bindings
├── 02-locale.js    # English (en) and Chinese (zh) dictionaries
├── 03-format.js    # Date/reset and percentage formatting
├── 04-modals.js    # AllLimitsModal and OneLimitModal dialogs
├── 05-bar.js       # ActiveKeyButton for composer bar
├── 06-float.js     # FloatChip draggable badge with viewport clamp
├── 07-settings.js  # Settings card, fields, and one-click updater
└── 08-apply.js     # DSH plugin client bootstrap and slot injections
```

---

## License

MIT © GoodAndReady
