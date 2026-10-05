# Changelog

## 0.2.14

### Provider Quotas & Schema Field Pipeline Fixes
- **Provider Quota & Balance Normalization (#99)**:
  - Extracted nested provider balances (SiliconFlow) and quota windows (Groq, Anthropic, Gemini) in `refreshSubscriptionEntry`.
  - Mapped rate limit windows directly to `primaryWindow`, `secondaryWindow`, and `tertiaryWindow`.
  - Preserved `cnyRemaining` and `cnyLimit` fields in `refreshSubscriptionEntry`, `saveSubCards`, and `loadSubs`, ensuring CNY balances for SiliconFlow and DeepSeek persist to disk and display in the UI.
- **Dynamic Field Schemas in AddKeyModal (#100)**:
  - Replaced hardcoded secret field and missing `schema.extra` check in `AddKeyModal` with dynamic iteration over `schema.fields`.
  - Rendered provider-specific required fields with custom labels and placeholders (e.g. Workspace ID for OpenCode GO, Session Cookie for Ollama, sec_token for Qwen).
  - Enforced `required: true` validation on all fields before submission.
- **OpenCode GO Cookie Header Normalization (#101)**:
  - Fixed duplicate `auth=auth_session=...` cookie header wrapping in `fetchOpenCodeGoQuota`.
  - Updated `normalizeOpenCodeAuthCookie` to recognize existing `auth_session=` and `auth=` prefixes.
- **ISO Rate Limit Reset Timestamp Parsing (#108)**:
  - Fixed `parseRateLimitResetSeconds` prematurely parsing ISO timestamp strings (e.g. `'2030-01-01T00:00:00.000Z'`) via `parseFloat`, which erroneously extracted the year number as +2030 seconds.
  - Prioritized `Date.parse(s)` for non-pure-numeric timestamp inputs to return true epoch milliseconds.

## 0.2.13

### DSH Supported Contracts & Session Disambiguation
- **Schemastery Volatile Settings & ConfigForm Contract (#92)**:
  - Marked live-editable settings fields (`refreshHours`, `ui.floatChip`, `ui.composerBar`, `ui.activeOnTop`) as `.volatile()` in Schemastery schema, allowing seamless mutation through DSH `configForms`.
  - Added Schemastery `.volatile()` polyfill and unboxed values via `plainConfig(value)`.
  - Replaced non-existent `scope.get()` calls in client `ConfigFields` with canonical `scope.getSnapshot()`, `scope.subscribe()`, and `scope.mutate(ops)`.
- **Settings Service Contract & Volatile Updates (#93)**:
  - Removed dead `settings.register` API call.
  - Implemented `describeRow()` and `syncSettingsSnapshot()`, dynamically synchronizing configuration on `settings/document-updated` and `loader/volatile-update` events.
  - Connected `setExtraLogger` for provider diagnostics.
- **Canonical DSH 0.2 Session Events & Hydration (#102)**:
  - Added support for canonical DSH 0.2.0-rc.1 session events: `request/header` (`event.data.header.config`) and `request/context` (`event.data.provider/model`).
  - Added startup hydration `seedExistingSessions()` from `ctx.sessions.list()` so existing active chats show correct quota cards immediately upon plugin load.
  - Auto-invalidated cached session subscription bindings when provider switches.
- **Ambient Credential Matching & Ambiguous Multi-Match (#103)**:
  - Rewrote session credential binding to resolve ambient provider credentials dynamically (`DEEPSEEK_API_KEY`, etc.) and disambiguate multi-account setups via rule `AS-M4`.
  - When multiple accounts exist for a provider without matching ambient credentials, returns degraded state (`subId: null, rule: 'AS-M1-multi', degraded: true, error: 'ambiguous'`) instead of blindly guessing the first account (`hits[0]`).
  - In `matchSub`, handled credential fingerprint collisions with degraded rule `AS-M4-multi`.
- **LocaleFace Contract & Provider Hints Localization (#109)**:
  - Upgraded client to `LocaleFace` specification using `ctx.locale.getSnapshot().active` and `ctx.locale.subscribe(...)`.
  - Bound plugin translations with `ctx.locale.bind('dsh-key-limits')`.
  - Localized all 14 provider labels and hints in English and Chinese dictionaries.
  - Localized modal eyebrow texts (`activeSessionEyebrow`, `hubEyebrow`), removing hardcoded English strings.

## 0.2.12

### Security & Storage Integrity Hardening
- **Secret Extra Masking & Permissions (#96)**:
  - Masked Ollama session cookie (and any provider secret extra fields) on disk in `subs.json` (`secret: ''`, `extra: ''`).
  - Stored session cookie in DSH `credentials` service via `extraCredentialRef` (`DSH_KEY_LIMITS_<ID>_EXTRA`).
  - Enforced `0600` POSIX file permissions (`mode: 0o600` and `chmodSync`) on `subs.json` and temporary swap files to prevent multi-user local leakage.
- **Revoked Credential Memory Purging (#97)**:
  - Reset in-memory secret cache (`c.secret = ''` and secret `c.extra = ''`) before credential resolution in `hydrateSecretsFromCredentials`.
  - Prevented deleted/revoked credentials from lingering in memory, auto-refresh, or leaking into encrypted backup exports via `POST /dsh-key-limits/export`.
- **Redirect Auth Header Leak Prevention (#98)**:
  - Defaulted `fetchWithTimeout` redirect mode to `error`, blocking automatic HTTP 301/302/307 redirects to external origins and preventing cross-origin credential header leakage.
- **Disk Persistence Error Propagation & Rollback (#104)**:
  - Prevented silent persistence failures in `CredentialStore._save()` by cleaning up temporary files and propagating I/O errors.
  - Implemented transactional rollback for in-memory credential maps (`creds` and `meta`) when disk writes fail.
  - Returned HTTP 500 on disk failures in `POST /subs` and `DELETE /subs` instead of false success.
- **Ghost Subscription Resurrection Protection (#105)**:
  - Added monotonic credential revision tracking (`rev`) on subscription entities.
  - Discarded stale card revisions and filtered out deleted credentials in `saveCards()` to prevent in-flight refreshes from resurrecting removed accounts.

## 0.2.11

### Security, Lifecycle & Resiliency Fixes
- **Export Secret Hydration (#85)**:
  - Ensured credentials secrets are fully hydrated (`hydrateSecretsFromCredentials`) before serialized by `POST /dsh-key-limits/export`, preventing empty secrets in exported bundles right after server restart.
- **Client Disposer & Slot Cleanup (#86)**:
  - Wrapped composer bar slot (`conversation.composer.bar`) and settings card slots (`plugins.item`, `plugins.row.config`, `settings.plugin.item`) in `ctx.effect` returning disposer functions to prevent slot listener leaks during client HMR and page re-renders.
- **Manifest Injection Parity (#87)**:
  - Replaced direct `klCtx.sessions` read with safe `klCtx.get('sessions')` and aligned `package.json.dsh.client.inject` with runtime client bundle declaration (`slots`, `locale`, `configForms`).
- **HTTP JSON Body Syntax Diagnostic (#88)**:
  - Raised explicit `JsonParseError` (HTTP 400 Bad Request) on malformed JSON payload bodies across `/export`, `/import`, and `/subs` endpoints instead of silent failure or generic internal errors.
- **Disk Write Race Condition Coordination (#89)**:
  - Routed subscription card file writes (`saveSubCards`) through `CredentialStore.prototype.saveCards` and `CredentialStore._save()`, preventing clobbering and race conditions when cards and secret credentials persist to `subs.json` concurrently.
- **Settings Config Route CSRF Protection (#90)**:
  - Added `isTrustedSettingsRequest` origin and referer check to `GET /dsh-key-limits/config`, blocking unauthorized cross-origin requests from reading local provider configurations.

## 0.2.10

### Backup Security & Batch Refresh
- **Encrypted Subscription Export and Import (#80)**:
  - Added military-grade AES-256-GCM encryption with Scrypt key derivation (`lib/crypto-backup.js`) for exporting and importing subscription configurations with secrets.
  - Implemented secure backend endpoints `POST /dsh-key-limits/export` and `POST /dsh-key-limits/import` protected by fail-closed `isTrustedSettingsRequest`.
  - Added Export/Import UI buttons with passphrase prompts in the Settings card.
- **Forced Batch Update Refresh All (#81)**:
  - Added "Refresh All" button with spinning icon animation in `AllLimitsModal` header.
  - Implemented `POST /dsh-key-limits/refresh-all` backend route clearing cached quotas and orchestrating parallel refreshes with concurrency pool.

## 0.2.9

### Providers & UI Controls
- **SiliconFlow (SiliconCloud) Provider (#75)**:
  - Added native SiliconFlow auto-fetcher querying balance and total credits via `https://api.siliconflow.cn/v1/user/info`.
  - Added `parseSiliconFlowInfo` parsing CNY and USD balances.
  - Registered `siliconflow` provider pill and branding.
- **Anthropic, Groq, and Gemini Providers (#76)**:
  - Added Groq auto-fetcher parsing RPM and TPM rate limit headers (`x-ratelimit-*`).
  - Added Anthropic auto-fetcher parsing requests and tokens rate limits (`anthropic-ratelimit-*`).
  - Added Google Gemini provider integration verifying API status and key health.
  - Implemented modular `lib/provider-extra-fetchers.js` keeping all modules within the 600-line standard.
- **Docked Mode for Floating Chip (#77)**:
  - Added pin/dock button in floating chip header.
  - Implemented `.kl-float-docked` fixed corner mode (non-draggable, neatly docked to lower corner) with localStorage persistence.
- **Global Hotkey Alt+K (#78)**:
  - Registered global keyboard shortcut `Alt+K` to toggle the All Limits Hub modal from anywhere in the DSH workspace.
  - Prevented key intercept when active input/textarea has focus.
- **Danger Toast Low-Quota Notification (#79)**:
  - Added non-intrusive floating toast banner notifying user when active key falls below 15% quota.
  - Dismissible with auto-snooze to avoid repetitive alert spam.

## 0.2.8

### Features & Predictive Analytics
- **Pool Health Indicator (#71)**:
  - Added `poolStats` analyzer computing total accounts, healthy count (active quota > 15%), warning count (15% .. 30%), and exhausted/errored accounts with per-provider breakdown.
  - Added live Pool Health stat card in `AllLimitsModal` displaying healthy/total ratio and dynamic status dot indicator.
- **Burn Rate & Velocity (#72)**:
  - Added rolling timestamped usage snapshot recorder (`recordUsageSnapshot`) in browser `localStorage` capturing quota level snapshots over a 24-hour horizon.
  - Added velocity calculation engine (`calcBurnRate`) estimating hourly consumption rate (`%/h`) and project time to depletion (`hours left`).
  - Added Burn Rate metrics card in `AllLimitsModal`.
- **Reset Countdown in Chip & Cards (#73)**:
  - Added `findNearestReset` calculating the nearest impending quota replenishment across all registered accounts.
  - Updated floating chip tooltip with dynamic countdown timer (`Resets in Xh Ym`).
  - Added reset countdown tag on `SubCard` and modal headers.
- **24-Hour Usage Sparkline (#74)**:
  - Integrated lightweight, responsive SVG sparkline component (`UsageSparkline`) rendering historical consumption trends.
  - Styled with semantic theme color-mix variables (`--dsw-alias-state-success`, `--dsw-alias-state-warning`, `--dsw-alias-state-danger`) conforming to zero-hex/zero-rgba design standards.

## 0.2.7

### Refactor & Quality
- **Test production code directly (#67)**:
  - Rewrote `test/format.test.mjs` to execute real `src/client/03-format.js` production implementation in an isolated VM sandbox, removing local duplicate copy of `fmtReset`. Added direct tests for `fmtPct` and `minRemaining`.
- **Modular provider parsers & file size standard (#68)**:
  - Extracted parsing, normalization, plan constants, and hashing helpers into new modular `lib/provider-parsers.js` (~240 lines).
  - Reduced `lib/provider-fetchers.js` from 763 lines to 590 lines (comfortably below the 600-line DSH standard) while keeping complete backward-compatible exports.
- **Client best-effort catch documentation (#69)**:
  - Clarified and documented all 5 empty `catch`-blocks in `src/client/` (`01-prelude.js`, `03-format.js`, `06-float.js`) with explicit best-effort intention comments to prevent silent failures and ensure unmount/transient error safety.

## 0.2.6

### Security
- **Fail-closed request source validation (#60)**:
  - Enforced strict fail-closed source verification in `isTrustedSettingsRequest`: requires valid `Host` / `X-Forwarded-Host`, verifies `Origin`/`Referer`, rejects explicit `cross-site`, and requires a verified source indicator (`same-origin`, `same-site`, `none`, or explicit internal auth token `x-dsh-internal-auth: 1`).
  - Requests missing source metadata or passing empty headers are denied with `403 Forbidden`.
- **Bounded body reader & DoS mitigation (#64)**:
  - Added `DEFAULT_MAX_BODY_BYTES = 64 * 1024` (64 KB) limit and `PayloadTooLargeError` to `readJsonBody`.
  - Enforced streaming size limit on `POST /dsh-key-limits/subs`, rejecting oversized bodies with `413 Payload Too Large` without mutating credentials or storage.
- **Opaque health route (#65)**:
  - Removed host absolute storage path (`storageDir`) from `GET /dsh-key-limits/health` response, returning clean status `{ ok: true, name:  dsh-key-limits, status: healthy }`.
- **Credential scrubbing in subs.json (#12)**:
  - Enforced `secret: '` in `CredentialStore._save()`, guaranteeing that plaintext secrets are never written to disk in `subs.json` and are solely stored in the DSH credentials service.

## 0.2.5

### Security
- **Cross-site request forgery (CSRF) defense for subscription endpoints (#60)**:
  - Added `isTrustedSettingsRequest` in `lib/http-utils.js` verifying `Sec-Fetch-Site` and validating `Origin`/`Referer` against `Host` and `X-Forwarded-Host`.
  - Guarded `POST /dsh-key-limits/subs` to prevent unauthorized cross-site credential writing before `credentials.set` is reached.
  - Guarded `DELETE /dsh-key-limits/subs`, `GET /dsh-key-limits/subs`, and `GET /dsh-key-limits/active-sub` to reject cross-site requests with `403 Forbidden`.
  - Added comprehensive automated test suite `test/trusted-subs-request.test.mjs` verifying that cross-site requests are rejected and never mutate credentials or storage.

## 0.2.4

### Fixed
- Settings no longer wait on the removed settingsScope service. The client uses configForms (#61).

## 0.2.3

- **Account Ordering & Clean Exports (Stage 1)**:
  - Fixed account ordering in UI by wiring `sortSubscriptions` to `buildSubsList` in `lib/cards.js`, ensuring deterministic sorting by status, reset date, and quota pressure across float chips, composer bars, and settings cards (#48).
  - Encapsulated internal helper `cardFromRefresh` inside `lib/cards.js` by removing it from exports (#54).
- **Backend Observability & Error Logging (Stage 2)**:
  - Added safe error logging to host background refresh routines and JSON body parser in `lib/index.js` instead of silently ignoring failures (#52).
  - Enhanced observability across provider adapters and subscription store with safe credential redaction via `setProviderLogger` (#50).
- **Architecture Decomposition & Internal Documentation (Stage 3)**:
  - Extracted shared HTTP utilities (`readQuery`, `readJsonBody`, `json`, `toCredentialRef`, `defaultCredRef`) into dedicated `lib/http-utils.js` module, reducing `lib/index.js` apply facade complexity (#51).
  - Documented internal test exports in `lib/plugin-updater.js` with clear comments explaining their usage in test fixtures (#55).
- **Client Network Robustness & Parity Guard (Stage 4)**:
  - Hardened client networking in `src/client/03-network.js` by replacing bare `fetch` calls with `fetchWithTimeout` (10-second default timeout with `AbortController`), preventing UI deadlocks on network stalls (#49).
  - Added build parity guard `test/build-parity.test.mjs` verifying that `lib/client.js` stays strictly synchronized with `src/client/*.js` bundle sources (#53).

## 0.2.2

- **Settings reachable again on the plugin's own page**: the surface is now registered
  into the plugin-list seat `plugins.item` (`id: 'dsh-key-limits'`, order 60, static
  label) — the current core (0.1.6-alpha.2) renders a plugin's configuration page only
  for entries registered there, which is how `dsh-agentrouter` and
  `dsh-agent-orchestrator` show their settings. The row seat `plugins.row.config` and
  the legacy `settings.plugin.item` card stay as fallbacks. Sources edited in
  `src/client/07-settings.js`, `lib/client.js` rebuilt.

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
