# Changelog

## 0.2.1

- **Settings on the plugin's own page**: the client registers the settings surface
  into the Plugins page row seat, `plugins.row.config`, keyed
  `@goodandready/dsh-key-limits#dsh-key-limits`. The plugin's row gains a configure
  control whose page is the settings form (`view: 'page'`, rendered bare — the host
  page draws the title, icon, crumb and padding), with a one-line state under the
  title (`view: 'summary'`). The current DSH core does not render the legacy
  `settings.plugin.item` seat at all, which is why the card was unreachable; that
  seat stays registered as a fallback for older cores (#43).
- New guard `test/row-seat.test.mjs`: the row key is checked against the package
  name and the row id in `cordis.patch.yml`, the legacy seat must stay registered,
  and the page view must render without the card wrapper.

## 0.2.0

- **Architecture Decomposition**:
  - Decomposed `lib/subs.js` into modular architecture, extracting provider balance and quota adapters into `lib/provider-fetchers.js`.
  - Preserved backward-compatible re-exports across all provider schemas and fetchers.
- **Strict DSH Theme Variables**:
  - Replaced all standalone `rgba(...)` and hex color literals in client styles with native DSH CSS design tokens (`--dsw-alias-bg-*`, `--dsw-alias-border-*`, `--dsw-alias-label-*`, `--dsw-alias-state-*`), ensuring pixel-perfect dark and light theme switching.
- **UI Chevron Standard**:
  - Integrated DSH core chevron primitive `IconChevronDownOutline14` from `@deepseek-ai/dsh-client-ui-primitives` with graceful SVG fallback and CSS rotation animations.
- **Namespace & Route Isolation**:
  - Disambiguated `SETTINGS_NS = 'dsh-key-limits'` (matching DSH settings slot) and `ROUTE_PREFIX = '/dsh-key-limits'` (HTTP routes prefix).
- **Localization Standard**:
  - Fully purged hardcoded Russian strings and internal `KL_ru` dictionary from codebase; runtime Russian translation is managed cleanly by `dsh-russian-lang`.
- **Security Sanitization & Publication Layer**:
  - Untracked internal development files (`AGENTS.md`, `index.md`, `docs/TZ.md`, plans, staging deploy scripts) from git index and configured `.gitignore` and `.gitattributes`.
  - Added `publish.sh` reproducible publication layer using git plumbing for clean fast-forward pushes to public GitHub repository.
- **Repository Canonical Relocation**:
  - Relocated repository to `/mnt/external/Project/DEV/dhsplugins/dsh-key-limits` per `dhs-plugin-release-workflow`.
- **Test Suite Expansion**:
  - Expanded unit test suite from 24 to 49 comprehensive tests, including true VM behavioral locale collision testing, card ordering, and offline parser mocks for all 9 providers.

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
