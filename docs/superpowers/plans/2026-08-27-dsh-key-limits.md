# dsh-key-limits Implementation Plan

> **For agentic workers:** implement task-by-task after TZ approve. Checkboxes for tracking.

**Goal:** New DSH plugin `@goodandready/dsh-key-limits` that only shows API-key/subscription quotas via float chip (all), composer-bar button (active one), and settings CRUD.

**Architecture:** Greenfield package. Host = credentials store + provider quota fetchers + tiny HTTP API. Client = three surfaces, no ledger. Port quota code from `dsh-spendmeter` `lib/subs.js`; leave spend/ledger behind. Cut over staging by removing spendmeter.

**Tech Stack:** DSH plugin (cordis), Schemastery Config, React client via ModuleLoader, Gitea `goodandready/dsh-key-limits`, deploy `file:/mnt/external/Project/DEV/dsh-key-limits`, profile `web`.

## Global Constraints

- Package name `@goodandready/dsh-key-limits`, settings NS `dsh-key-limits`, HTTP `/dsh-key-limits`
- git via `git-cursor`; remote Gitea; no scp overlays into dsh share
- Client source in `src/client/`, build to `lib/client.js`
- Schemastery: no `.optional()` on numbers — use `.default(...)`
- Settings card: prefixed CSS (`kl-`), core metrics (12px / 15px), theme vars only
- Do not publish to npm without explicit user approve
- Do not reintroduce spend/ledger/CC

---

## File map (target)

```
dsh-key-limits/
  package.json
  cordis.patch.yml
  README.md
  CHANGELOG.md
  lib/index.js          # apply, Config, routes
  lib/subs.js           # store + PROVIDERS fetch (port)
  lib/active-sub.js     # match session → sub
  lib/client.js         # built
  src/client/
    ORDER
    01-prelude.js       # requires, css
    02-locale.js
    03-format.js
    04-modals.js        # OneLimit / AllLimits
    05-bar.js           # ActiveKeyButton
    06-float.js         # FloatChip
    07-settings.js      # card + CRUD UI
    08-apply.js
  scripts/build-client.mjs
  scripts/smoke-staging.sh
  scripts/deploy-staging.sh
  test/*.test.js
```

---

### Task 1: Scaffold repo + empty plugin loads

**Deliverable:** Package on Gitea + DEV path; `dsh plugin add file:…` loads without error; `/dsh-key-limits/health` OK.

- [ ] Create `/mnt/external/Project/DEV/dsh-key-limits`, `git-cursor init`, Gitea repo `goodandready/dsh-key-limits`
- [ ] `package.json` (name, version `0.1.0`, dsh.client.inject: runtime/locale/ui-slots)
- [ ] Minimal `lib/index.js`: Config, settings.register(NS), health route
- [ ] Minimal `lib/client.js` / `src/client`: `apply` no-op + inject slots/locale
- [ ] Smoke load on staging **alongside** spendmeter (no remove yet)
- [ ] Commit: `chore: scaffold dsh-key-limits`

### Task 2: Host — subs store + providers + API

**Deliverable:** CRUD + refresh quotas via HTTP; unit tests for match/fingerprint helpers.

- [ ] Port `CredStore` / `PROVIDERS` / `fetchSubCard` from spendmeter (trim spend-only paths)
- [ ] Routes: `/subs`, `/config`, `/active-sub`
- [ ] Tests: providerSchemas shape, matchSub prefers fingerprint, allocateSubId
- [ ] Commit: `feat(host): subs store, providers, HTTP API`

### Task 3: Client — ActiveKeyButton (composer bar)

**Deliverable:** Bar shows active quota %; click opens **one-sub** modal only.

- [ ] `ActiveKeyButton` + `OneLimitModal` (windows, reset, stale, error)
- [ ] Slot `conversation.composer.bar`, priority ~10
- [ ] Poll `/active-sub?sessionId=`
- [ ] Manual check on staging session with known key
- [ ] Commit: `feat(client): composer bar active-key limit`

### Task 4: Client — FloatChip (all limits)

**Deliverable:** Draggable chip; click opens **all** subscriptions limits page.

- [ ] `FloatChip` + `AllLimitsModal` (list cards, refresh one/all)
- [ ] Position persist `localStorage` key `kl-chip-pos`
- [ ] `ui.floatChip` gate from `/config`
- [ ] Commit: `feat(client): float chip all limits`

### Task 5: Client — Settings card CRUD

**Deliverable:** Plugin card: add/delete/refresh keys; core-aligned `kl-*` styles.

- [ ] `settings.plugin.item` key `dsh-key-limits` + locale register
- [ ] Add modal (provider schema fields), list, delete confirm
- [ ] Fallback `settings.section` only if plugin slot missing (timer pattern like grok)
- [ ] Commit: `feat(client): settings card key CRUD`

### Task 6: Polish, smoke, cutover

**Deliverable:** Spendmeter removed from web profile; only key-limits on staging; docs + issue closed.

- [ ] README + CHANGELOG; smoke/deploy scripts (file: only)
- [ ] Full smoke on `dsh-key-limits`
- [ ] `dsh plugin remove @goodandready/dsh-spendmeter`; restart; verify no spendmeter routes
- [ ] Gitea: note on spendmeter README «superseded by dsh-key-limits»; optional archive issue
- [ ] Commit + tag `v0.1.0` (no npm publish)
- [ ] Remember brain: package path, NS, cutover done

### Task 7 (optional follow-up, separate issue)

- [ ] Import subs from `~/.dsh/storages/dsh-spendmeter`
- [ ] Single slash `/limits`
- [ ] Narrow provider list if user wants api_key-only

---

## Cutover checklist

1. key-limits green on staging  
2. remove spendmeter from profile web  
3. restart dsh-web  
4. journal: no failed to apply  
5. bar + float + settings smoke manually  

## Out of plan

Reworking token-tracker, Hermes spend API, npm publish.
