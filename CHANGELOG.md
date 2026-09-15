# Changelog

## 0.1.10

- **Public Package Transition**:
  - Rebranded package scope to `@goodandready/dsh-key-limits` for canonical public release.
  - Aligned package repository URLs to `GooDAnDReaDY/dsh-key-limits`.
  - Configured public npm registry (`https://registry.npmjs.org`) in updater and manifest.
  - Synchronized client loader entry and Cordis patch definitions.
- **Documentation Standard**:
  - Added full multi-language hero headers with official showcase badges, GitHub star/issue tables, and Mermaid architecture diagrams across `README.md`, `README.zh.md`, and `README.ru.md`.
  - Comprehensive provider reference table including Command Code rolling, weekly, and monthly quotas.
  - Updated configuration guide with `activeOnTop` and `order` options.

## 0.1.9

- **UI Polish & Spacing**:
  - Added 12px gap between subscription cards (`.kl-list`), resolving card overlap.
  - Softened visual theme: calmer progress bars, subdued text contrast for healthy states, subtle bento cells and provider pills.
  - Changed summary metric label to "Всего аккаунтов" (`totalAccounts`).
- **Account Reordering & Pinned Active Sub**:
  - Added "active account always on top" (`ui.activeOnTop`, enabled by default).
  - Added custom account display ordering (`ui.order`) with Up/Down controls in settings.
- **Humanized Reset Countdown**:
  - `fmtReset` now shows days and hours (e.g. `5d 5h 19m`) for countdowns >= 24h, and only hours and minutes for < 24h.
- **Command Code Monthly Quota**:
  - Extended `fetchCommandCodeQuota` to query `/alpha/billing/subscriptions`, calculating monthly credit allowance and reset date into `tertiaryWindow`.

## 0.1.8

- **Provider Support**:
  - Added Command Code (`commandcode`) provider: fetches quota windows (5h, weekly) from `https://api.commandcode.ai/alpha/billing/credits`.
  - Bound `COMMANDCODE_API_KEY` in `credentialRefs`.
- **Loader Resilience**:
  - Made `loadSubs` robust: loads union of IDs from both `credentials` and `meta`, ensuring cards remain visible even when credentials are stored via external refs.
- **Tests**:
  - Added unit test suite for Command Code provider registration, schema, and loader resilience.

## 0.1.7

- **Resilience & Storage**:
  - Added 12s abort timeouts (`AbortSignal.timeout`) to all provider quota fetchers in `lib/subs.js`.
  - Added atomic storage persistence (`.tmp` + `renameSync`) in `CredentialStore` and `saveSubCards`.
  - Added safe error isolation and parsing for MiniMax and OpenCode.
- **Provider Schemas**:
  - Added `schemas: providerSchemas()` to `GET /config` route, fixing empty dropdown in `AddKeyModal`.
- **Localization Standard**:
  - Added complete Chinese (`zh`) dictionary in client, aligned with `en`.
  - Removed internal Russian dictionary (`KL_ru`); delegated runtime Russian translation to `dsh-russian-lang` (#201).
  - Standardized all provider hints, placeholders, and error messages to English.
- **Client UI/UX**:
  - Isolated styles with `data-dsh-plugin="dsh-key-limits"` attribute mounted cleanly via `ctx.effect`.
  - Fixed `fmtReset` numeric epoch millisecond timestamp countdown parsing.
  - Added viewport clamping (`clampPos`) to `FloatChip` to prevent dragging outside browser edges.
  - Added `Escape` key listeners to dismiss all modal dialogs.
- **One-Click Updater**:
  - Added `lib/plugin-updater.js` with loopback/same-origin security.
  - Added `/dsh-key-limits/update` endpoint and UI card status/button.
- **Documentation**:
  - Added comprehensive `README.md` (en), `README.zh.md` (zh), `README.ru.md` (ru), and `docs/design/DESIGN.md`.

## 0.1.6

- settings.register via ctx.inject(['settings']).
- Settings → Plugins card only (removed settings.section fallback).
- Config fields bound through settingsScope.
- Subscription secrets stored via DSH credentials service.

## 0.1.1

- fix: composer bar session id via sessions.list.getSnapshot (was wrong API)


## 0.1.0

- Initial release: float chip (all limits), composer bar (active key), settings CRUD
- Replaces `@goodandready/dsh-spendmeter` for quota UI
