# Changelog

## 0.2.26

### DSH Desktop Electron Referer Support (#152)
- **Non-HTTP Referer Loopback Passthrough (#152)**:
  - Fixed issue where DSH Desktop Electron stripped `Origin` and `Sec-Fetch-Site` headers while preserving `Referer: dsh-app://app/`, causing `isTrustedSettingsRequest` in `lib/http-utils.js` to reject all incoming requests (`/config`, `/active-sub`, `/subs`, `/refresh-all`, `/export`, `/import`) with HTTP 403 Forbidden.
  - Restricted strict `u.host === expectedHost` referer checks to `http:` and `https:` schemes only.
  - Added loopback remote verification (`isLoopback`) for custom scheme referers (e.g. `dsh-app://`), allowing legitimate DSH Desktop calls to reach plugin endpoints while maintaining strict CSRF defense against remote callers.
  - Preserved fail-closed defenses for missing source headers without socket and rejected cross-site requests.
  - Exported `isLoopback` utility and added comprehensive unit and route integration tests.

## 0.2.25

### Block 6: Audit Follow-up Fixes (#115, #120, #121)
- **Burn-Rate Series Isolation and SubId Preservation (#115)**:
  - Updated `recordUsageSnapshot` in `03-format.js` to compare both `bucketTime` and `lastSid === sid` before updating bucket, ensuring that transitioning from active account to pool does not overwrite active account snapshots with pool values.
  - Refactored `calcBurnRate` to strictly filter points by `targetSubId` without `!p.subId` wildcard, completely eliminating cross-series contamination (e.g. pool minimum mixed into account A's series).
- **StorageDir Locale and Documentation Alignment (#120)**:
  - Replaced outdated `settings.yaml` notes on `storageDir` disabled input in `02-locale.js` (`storageDirRestartNote`) with modern profile plugin configuration notes in EN and ZH.
  - Aligned parameter table in `README.md` to reference profile plugin configuration.
- **Index, AGENTS, and Mirror Metric Synchronization (#121)**:
  - Synchronized `index.md` header, status, and test counts to release 0.2.25.
  - Removed stale duplicate version lines in `index.md` history table.
  - Aligned healthcheck smoke commands in `index.md` and `AGENTS.md` with Loopback / Same-Origin guard (`-H "Host: 127.0.0.1:3080" -H "Origin: http://127.0.0.1:3080"`).
  - Aligned GitHub mirror check metric to 22 product files.

## 0.2.24

### Block 5: Audit Recheck Fixes (#97, #106, #107, #109, #115, #120, #121)
- **Itemized Unresolved Credentials Warning on Export (#97)**:
  - Extended export credential validation to verify `extraCredentialRef` alongside primary `credentialRef`.
  - Emitted structured itemized warnings for any missing required credential fields (e.g. Ollama session cookies).
  - Enhanced `BackupSection` in UI to display localized warning notices when an export contains unresolved entries.
- **UI Settings Persistence Failure Warning on Import (#106)**:
  - Enhanced `handleImportFile` in `BackupSection` to detect `settings_update_failed` warnings and render a visible notice indicating that subscription keys were imported but UI custom ordering / toggles failed to persist.
- **Exact UTF-8 Passphrase Size Calculation in Export (#107)**:
  - Replaced ASCII character length estimation with exact UTF-8 byte serialization `Buffer.byteLength(JSON.stringify({ passphrase: String(passphrase), backup }))`.
  - Guaranteed symmetric size boundaries between export pre-check and import 8 MiB envelope enforcement for multi-byte Unicode passphrases.
- **Complete Schema Field Translations and Label Fallback (#109)**:
  - Added localized label keys for all 17 schema fields across English and Chinese dictionaries.
  - Introduced `getFieldLabel` helper in `07-settings.js` that rejects `result === key` translation misses and gracefully falls back to human-readable `field.label`, ensuring 0 raw `prov_field_*` tokens are displayed.
- **Decoupled Active Subscription History Recording (#115)**:
  - Updated `FloatChip` to record the active subscription's own quota when active, and pool minimum under `null` otherwise.
  - Eliminated false cross-account data points (e.g. A=90%, B=10%) in single-subscription burn-rate calculations.
- **Documentation and Runtime Contract Alignment (#120)**:
  - Clarified that Web UI settings card and profile configuration are the primary setup methods in modern DSH runtimes, framing `settings.yaml` as legacy migration.
  - Synchronized `/health` endpoint documentation with same-origin / loopback protection and exact `{ ok, name, status }` response payload.
  - Cleaned up lingering cooldown references in Russian documentation.
- **Gitea Worktree Rules and Metric Matrix Alignment (#121)**:
  - Synchronized `AGENTS.md` and `index.md` with version 0.2.24, 164+ test matrix, 8 MiB / 500 entries backup limits, and restored complete version history.

## 0.2.24

### Block 5: Audit Recheck Fixes (#97, #106, #107, #109, #115, #120, #121)
- **Itemized Unresolved Credentials Warning on Export (#97)**:
  - Extended export credential validation to verify `extraCredentialRef` alongside primary `credentialRef`.
  - Emitted structured itemized warnings for any missing required credential fields (e.g. Ollama session cookies).
  - Enhanced `BackupSection` in UI to display localized warning notices when an export contains unresolved entries.
- **UI Settings Persistence Failure Warning on Import (#106)**:
  - Enhanced `handleImportFile` in `BackupSection` to detect `settings_update_failed` warnings and render a visible notice indicating that subscription keys were imported but UI custom ordering / toggles failed to persist.
- **Exact UTF-8 Passphrase Size Calculation in Export (#107)**:
  - Replaced ASCII character length estimation with exact UTF-8 byte serialization `Buffer.byteLength(JSON.stringify({ passphrase: String(passphrase), backup }))`.
  - Guaranteed symmetric size boundaries between export pre-check and import 8 MiB envelope enforcement for multi-byte Unicode passphrases.
- **Complete Schema Field Translations and Label Fallback (#109)**:
  - Added localized label keys for all 17 schema fields across English and Chinese dictionaries.
  - Introduced `getFieldLabel` helper in `07-settings.js` that rejects `result === key` translation misses and gracefully falls back to human-readable `field.label`, ensuring 0 raw `prov_field_*` tokens are displayed.
- **Decoupled Active Subscription History Recording (#115)**:
  - Updated `FloatChip` to record the active subscription's own quota when active, and pool minimum under `null` otherwise.
  - Eliminated false cross-account data points (e.g. A=90%, B=10%) in single-subscription burn-rate calculations.
- **Documentation and Runtime Contract Alignment (#120)**:
  - Clarified that Web UI settings card and profile configuration are the primary setup methods in modern DSH runtimes, framing `settings.yaml` as legacy migration.
  - Synchronized `/health` endpoint documentation with same-origin / loopback protection and exact `{ ok, name, status }` response payload.
  - Cleaned up lingering cooldown references in Russian documentation.
- **Gitea Worktree Rules and Metric Matrix Alignment (#121)**:
  - Synchronized `AGENTS.md` and `index.md` with version 0.2.24, 164+ test matrix, 8 MiB / 500 entries backup limits, and restored complete version history.

## 0.2.23

### Block 4: Canonical Tokens, Peer Dependencies, Health Security & Offline Hygiene (#119, #120, #121, #146, #147, #148)
- **Canonical Design System Status Tokens (#146)**:
  - Replaced non-canonical tokens in `01-prelude.js`, `04-modals.js`, and `07-settings.js` with canonical DSH tokens: `--dsw-alias-state-error-primary`, `--dsw-alias-state-warn-primary`, `--dsw-alias-state-success-primary`.
  - Verified 0 bare occurrences of `state-danger`, `state-warning`, and `state-success` remain in client bundle.
- **Service Peer Dependencies Declaration (#147)**:
  - Declared peerDependencies for host services in `package.json`: `@deepseek-ai/dsh-settings`, `@deepseek-ai/dsh-host-webserver`, `@deepseek-ai/dsh-session`, and `@deepseek-ai/dsh-credentials`.
- **Health Route Origin Guard Enforcement (#148)**:
  - Added `isTrustedSettingsRequest(req)` guard to `GET /dsh-key-limits/health` in `lib/routes.js`.
  - Enforced consistent 403 Forbidden protection on all 7/7 HTTP endpoints against unauthorized cross-origin requests.
- **Offline Network Guard and Unit Suite Isolation (#119)**:
  - Added `test/offline-guard.mjs` and hooked into `npm test` to strictly fail-closed on any unmocked external network access.
  - Mocked transport in `test/block7-security-hardening.test.mjs` test #124 to ensure 100% offline isolation.
- **Documentation and Contract Alignment (#120)**:
  - Reconciled `README.md`, `README.ru.md`, `README.zh.md`, and `docs/design/DESIGN.md` with active runtime contract.
  - Updated `?sessionId=` parameter, clarified dynamic UI config vs restart-only `storageDir`, removed non-existent 10s cooldown promise.
- **Gitea Worktree Hygiene & Three-Channel Separation (#121)**:
  - Removed `AGENTS.md` and `index.md` from `.gitignore` and committed them to Git so clean worktrees retain project rules.
  - Maintained complete exclusion from public layers via `.gitattributes: export-ignore` (GitHub) and `package.json: files` whitelist (npm).
  - Updated `index.md` metrics and `test/hygiene.test.mjs`.

## 0.2.22

### Block 3: UI/UX, Accessibility, Focus Management & Localization (#109, #110, #111, #115, #117)
- **Reactive Locale Subscriptions & Provider Field Translations (#109)**:
  - Subscribed ActiveKeyButton, FloatChip, OneLimitModal, AllLimitsModal, SubCard, and QuotaBars to useActiveLocale so all surfaces update dynamically on language switches without reload.
  - Added labelKey generation to providerSchemas in lib/subs.js and translated all secret/extra field labels and hints across English and Chinese dictionaries.
  - Enhanced AddKeyModal to resolve localized field labels and validation error messages seamlessly.
- **Authoritative Polling Cutoff & Timeout Feedback (#110)**:
  - Extended KeysInlineList polling cutoff to 30 attempts with an authoritative final fetch on cutoff to capture in-flight updates.
  - Terminated refreshing state and presented localized refreshTimeout error notice when queries exceed cutoff threshold.
- **Safe HTTP 403 / Error Handling in Settings Forms (#111)**:
  - Replaced unverified fetchWithTimeout on /subs in ConfigFields with fetchJson.
  - Preserved subsListRef.current and account ordering on 403 Forbidden or network errors, preventing silent wipeout, and displayed error message in msg.
- **Fixed Interval Buckets for Rolling Usage Snapshots (#115)**:
  - Replaced sliding interval checks in recordUsageSnapshot with fixed bucket alignment Math.floor(now / HIST_BUCKET_MS) * HIST_BUCKET_MS, preventing frequent samples from endlessly overwriting the same timestamp.
- **Accessible Modal Semantics, Focus Trap & Restoration (#117)**:
  - Added initial focus targeting, Tab/Shift+Tab focus trapping, Escape key dismissal, and prior focus restoration upon unmounting in PortalModal.
  - Enforced role="dialog", aria-modal="true", and descriptive aria-label accessibility attributes on all modal surfaces.

## 0.2.21

### Block 2: Configuration, Providers & Dynamic Scheduling (#92, #106, #112, #99)
- **Settings Card Stale Subscription & Storage Order Saving (#92)**:
  - Fixed stale closure in `src/client/07-settings.js` by tracking `subsList` via `useRef`, preventing subscription list wipeout during `scope.subscribe` snapshot notifications.
  - Included `{ op: "set", path: ["ui", "order"], value: s.order }` in `save()` mutation ops to ensure custom display ordering persists properly via `scope.mutate`.
  - Marked `storageDir` field as `readOnly={true}` with an explanatory label `(read-only, configured in settings.yaml, requires restart)`, avoiding deceptive "Saved" notices for runtime immutable paths.
- **Volatile Schema Definition & Import Error Propagation (#106)**:
  - Marked `order: z.array(z.string()).volatile().default([])` in Schemastery `Config` schema, ensuring `SettingsForms.write` and `settings.update()` permit live order mutations.
  - Handled `settingsSvc.update()` failure in `/import` route gracefully by propagating structured warning headers (`warning` and `warnings: [{ id: "ui_config", warning: "settings_update_failed" }]`) without silently mutating in-memory configuration.
- **Dynamic Periodic Refresh Rescheduling (#112)**:
  - Exported `rescheduleRefresh()` from `subManager` to dynamically re-evaluate `refreshHours` whenever `settings/document-updated`, `loader/volatile-update`, or `config` lifecycle events fire.
  - Cleared existing timers immediately upon configuration changes and rescheduled next quota check according to updated interval.
- **Accurate Gemini Quota Reporting (#99)**:
  - Eliminated synthetic `100%` quota window fabrication in `fetchGeminiQuota` when reading active model counts from `/v1beta/models`.
  - Returned `windows: []` to represent API connectivity and plan status without polluting aggregate quota calculations, pool stats, or alert toasts.

## 0.2.20

### Block 1: Core Security, Session Binding & Backup Reliability (#103, #131, #97, #107, #142)
- **Strict Origin Validation with Internal Auth (#131)**:
  - Enforced strict Origin-to-Host matching in `isTrustedSettingsRequest` before evaluating internal authorization headers (`x-dsh-internal-auth`), ensuring mismatched origins cannot bypass CSRF validation.
- **Authoritative Ambient Binding & No-Match Fallback Elimination (#103)**:
  - Preserved authoritative negative binding results (`rule: 'no-match'`) in `buildActiveSub` when an ambient credential does not match stored subscriptions, preventing improper fallback to arbitrary accounts (`AS-M1`).
  - Added metadata fingerprint comparison in `resolveSessionSubBinding` to maintain accurate binding detection across credential rotations.
- **Itemized Warnings on Export with Unresolved Credentials (#97)**:
  - Enhanced `/export` endpoint to detect unresolved credentials and return an itemized `warnings` array alongside structured warning messages, preventing silent incomplete backups.
- **Symmetric 8 MiB Export/Import Capacity (#107)**:
  - Expanded `MAX_BACKUP_BODY_BYTES` to 8 MiB symmetrically across export and import endpoints.
  - Added pre-export size verification against the import limit and confirmed reliable export/import of 150+ large cookie subscriptions (~7KB cookies, 2.16MB+ payload envelopes) without 413 rejections or truncation.
- **Preflight Exception Handling Cleanliness (#142)**:
  - Cleared all empty catch blocks across `lib/session-tracker.js`, `src/client/01-prelude.js`, `src/client/02-locale.js`, `src/client/03-format.js`, `src/client/07-settings.js`, and `src/client/08-apply.js`, achieving clean preflight verification (`FAIL=0`).


## 0.2.19

### Modular Architecture & Core File Decomposition (#51)
- **Decomposition of `lib/index.js` (< 250 Lines)**:
  - Decomposed the monolithic `lib/index.js` (previously 919 lines) into dedicated, single-responsibility modules:
    - `lib/session-tracker.js`: In-memory session tracking, LRU session bounding (`MAX_LIVE_SESSIONS = 500`), canonical session event listeners (`request/header`, `request/context`, `session/update`, `session/create`), startup session hydration, and active subscription matching logic (`resolveSessionSubBinding`, `buildActiveSub`).
    - `lib/sub-manager.js`: Subscription lifecycle management, in-memory card caching, credentials storage orchestration (`upsertSubFromBody`), automatic background periodic quota refresh with configurable interval, and subscription list presentation with sorting (`buildSubsList`).
    - `lib/routes.js`: HTTP REST API route registration (`/health`, `/config`, `/active-sub`, `/subs`, `/refresh-all`, `/export`, `/import`) with strict CSRF security checks (`isTrustedSettingsRequest`), input validation, and backup payload encryption/decryption handling.
  - Reduced `lib/index.js` to a concise 140-line facade that wires configuration, hooks lifecycle services, and delegates to the specialized modules.
- **Backward Compatibility & Integration Parity**:
  - Re-exported `extractRouteFromEvent` from both `lib/index.js` and `lib/session-tracker.js`.
  - Maintained full interface parity across all REST endpoints, configuration schemas, and Cordis lifecycle hooks with zero regressions (137/137 unit tests passing).
- **Regression Test Coverage**:
  - Added `test/modular-architecture.test.mjs` verifying line-count thresholds, module export contracts, and end-to-end route registration.

## 0.2.18

### Security Hardening, Cryptographic Matching & Session Bounding
- **Safe Logger Resolution (#128)**:
  - Guarded `ctx.logger` check in `lib/index.js` using `typeof ctx.logger === 'function' ? ctx.logger('dsh-key-limits') : (ctx.logger || ctx)`, preventing `TypeError` crashes when host logger is passed as an object.
- **Bounded In-Memory Session Storage (#130)**:
  - Enforced an LRU eviction limit (`MAX_LIVE_SESSIONS = 500`) on the internal `live` Map in `lib/index.js`, preventing unbounded memory growth in long-running processes with thousands of chat sessions.
  - Added `session/deleted` event listener to immediately purge disposed sessions from memory.
- **CSRF Defense-in-Depth for Internal Auth (#131)**:
  - Hardened `isTrustedSettingsRequest` in `lib/http-utils.js` by evaluating `sec-fetch-site === 'cross-site'` before checking internal authorization headers, ensuring cross-site requests cannot bypass CSRF validation.
- **Header-Based Gemini API Key Authentication (#132)**:
  - Refactored `fetchGeminiQuota` in `lib/provider-extra-fetchers.js` to transmit API keys via the standard `x-goog-api-key` HTTP header rather than embedding them in the URL query string, preventing credential exposure in HTTP access and proxy logs.
- **Cryptographic Fingerprint & Collision Prevention (#125)**:
  - Upgraded `credentialFingerprint` in `lib/subs.js` to utilize Node.js native `crypto.createHash('sha256')` (16-byte hex), replacing the legacy 32-bit polynomial hash and eliminating collision hazards across subscriptions.
  - Returns empty string when both secret and extra parameters are empty, preventing false fingerprint matches across unconfigured accounts.
- **Multi-Provider Data Consumer Parity (#124, #126, #127, #129, #133)**:
  - Verified and locked regression tests confirming nested balance and quota windows extraction, ID-preserving backup updates, settings service `describe()` lifecycle, and active extra logger coverage.

## 0.2.17

### Documentation Synchronization, Offline Test Guard & Project Hygiene
- **Offline Unit Test Guard & Provider Fast-Fail (#119)**:
  - Added input validation fast-fail in `lib/provider-fetchers.js` for Ollama Cloud (`fetchOllamaQuota`), Qwen Cloud (`fetchQwenQuota`), Kimi, MiniMax, DeepSeek, and OpenRouter, returning structured errors immediately when required credentials or cookies are absent without touching external networks.
  - Hardened unit tests in `test/providers-parsers.test.mjs` with mock fetch guards that throw on unexpected outbound calls, preventing accidental real HTTP requests to `https://ollama.com/api/me`.
  - Added comprehensive transport tests verifying Ollama metadata and usage parsing against stubbed responses.
- **Documentation Alignment Across Languages (#120)**:
  - Synchronized `README.md`, `README.ru.md`, `README.zh.md`, and `docs/design/DESIGN.md` with the active Schemastery `Config` schema (`storageDir`, `refreshHours`, `ui.floatChip`, `ui.composerBar`, `ui.activeOnTop`, `ui.order`).
  - Documented all 10 REST API endpoints: `/health`, `/config`, `/active-sub`, `/subs`, `/refresh-all`, `/export`, `/import`, and `/update`.
  - Clarified UI slot registrations (`plugins.row.config` primary seat with `plugins.item` backward-compatible fallback).
  - Clarified publication architecture, noting that npm and release packages distribute runtime production files, while dev sources and tests are maintained in the repository.
  - Reconciled design decisions regarding lightweight in-memory analytics (rolling 24h burn rate and SVG sparkline).
- **Internal Project Hygiene & Test Matrix (#121)**:
  - Added repository-level `AGENTS.md` and `index.md` based on DEV standard templates, establishing constraints, architecture reference, and a 7-step reproducible verification matrix.
  - Maintained strict publication hygiene by keeping `AGENTS.md` and `index.md` in `.gitignore` and `.gitattributes` (`export-ignore`), preventing exposure in npm tarballs and public GitHub mirrors.

## 0.2.16

### UI Lifecycle, Refresh Completion & Accessibility Hardening
- **Refresh Completion & Redundant Refresh Removal (#110)**:
  - Added bounded polling in `KeysInlineList` to automatically poll until `refreshing` completes (clearing stuck spinning state after async provider refresh).
  - Fixed `AllLimitsModal` "Refresh All" to query refreshed cards with `load(false)` instead of initiating a duplicate provider fetch via `load(true)`.
- **Client Error Handling & Structured HTTP Rejection (#111)**:
  - Added `fetchJson` helper rejecting non-2xx responses with structured error objects preserving error details.
  - Guarded `KeysInlineList` subscription state: network or server errors (403/500) now preserve existing subscription lists instead of wiping to an empty list `[]`.
  - Added promise rejection handlers and user-facing error notices to inline deletion and card refresh actions.
- **Dynamic Refresh Interval & Composer Bar Setting (#112)**:
  - Wired `refreshHours` setting to runtime background timers and cache staleness checks via dynamic `getRefreshIntervalMs()` instead of a fixed 60s hardcoded constant.
  - Included live `ui` configuration in `/active-sub` endpoint responses.
  - Enabled `ActiveKeyButton` in the composer bar to respect `ui.composerBar === false` by hiding the widget when disabled.
- **Client Style Tag Lifecycle Management (#113)**:
  - Removed top-level style injection at module evaluation; style tag insertion is now strictly bound to `ctx.effect`.
  - Returned robust teardown callback ensuring `<style>` tag is removed from document `<head>` on plugin disposal or hot reload.
- **Active Key Scoped Danger Toast (#114)**:
  - Scoped FloatChip danger alert to evaluate critical thresholds (quota <= 15% or zero balance) only on the subscription active in the current session.
  - Partitioned toast cooldown keys per account (`kl-last-danger-toast-${subId}`) in browser session storage, preventing alerts on one key from silencing alerts on another.
- **24-Hour Usage Trend Downsampling & Reset Handling (#115)**:
  - Expanded usage history storage to 144 points with 10-minute bucket downsampling (`HIST_BUCKET_MS = 600000`), accurately covering a full 24-hour horizon.
  - Enhanced `calcBurnRate` to detect quota replenishment or key changes (`q > prev.q + 5`), calculating burn rate from the latest cycle without false consumption spikes.
- **Pool Health Monetary Balance & Missing Data Semantics (#116)**:
  - Corrected `poolStats` to classify subscriptions with zero monetary balance (`balance.remaining: 0`) as `exhausted` rather than `healthy`.
  - Classified uninitialized or missing quota data without active balance as `exhausted` (failure/missing data state).
- **Modal Accessibility & Focus Management (#117)**:
  - Added modal dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-label`) to `PortalModal`.
  - Implemented keyboard Tab/Shift+Tab focus trapping within open dialogs and focus restoration to the previously active element upon close.
  - Added accessible labels to close buttons and credential form inputs in `AddKeyModal`, `OneLimitModal`, and `AllLimitsModal`.
- **Updater Registry Failure & Manual Fallback Display (#118)**:
  - Handled `latestCheckFailed: true` from registry checks by rendering a distinct "Check failed" state with a retry button instead of falsely claiming "Up to date".
  - Displayed explicit manual update instructions (`pnpm update @goodandready/dsh-key-limits`) when updates are available in environments where auto-update is disabled (`canAutoUpdate: false`).


## 0.2.15

### Backup & Transport Integrity
- **Lossless Backup Import & Identity Preservation (#106)**:
  - Preserved original subscription IDs and restored display labels across export and import cycles.
  - Normalized `label` and `alias` fields so imported accounts retain user-facing names.
  - Encrypted and restored UI layout configuration (`ui.order`, `activeOnTop`, `floatChip`, `composerBar`).
  - Added idempotent deduplication and collision policy in `upsertSubFromBody`: repeat backup imports update existing records in place instead of generating duplicate entries.
- **Transport Capacity & Slicing Refusal (#107)**:
  - Increased import body limit to `MAX_BACKUP_BODY_BYTES = 2MB` to comfortably accommodate multi-account backups with long session cookies (e.g. 51+ Ollama/OpenCode GO accounts expanding under hex ciphertext).
  - Enforced symmetric `MAX_BACKUP_ENTRIES = 500` validation across export and import; import rejects overlimit payloads prior to any disk writes.
  - Removed arbitrary `slice(0, 50)` truncation; all valid entries are imported with itemized results returned in response.
- **HTTP 413 Socket Lifecycle (#122)**:
  - Fixed premature socket teardown (`req.destroy()`) in `readJsonBody`, replacing it with stream draining via `req.resume()`.
  - Configured `json()` helper to emit `Connection: close` on HTTP 413, preventing client `ECONNRESET` and ensuring structured JSON delivery over real HTTP sockets.

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
