# Project instructions: dsh-key-limits

## Product / purpose

- Project: dsh-key-limits
- Canonical source: DEV/dsh-key-limits
- Package route: private
- Package name: @goodandready-private/dsh-key-limits
- Purpose: show API-key and subscription quota limits in the web UI.
- Status: active (verified by test-server HTTP health check on 2026-08-27).

## Source and release

- Gitea repository: goodandready/dsh-key-limits.
- GitHub Packages repository: goodandready-private/dsh-key-limits.
- Production accepts only an exact published private package version.
- The three package identity sites must stay aligned: package.json name,
  cordis.patch.yml name, and the browser loader id.
- The private route was explicitly selected by the owner for this migration.

## Constraints

- Work only in a Git worktree; the project root is read-only.
- Do not add source-directory dependencies, machine paths, hostnames, IPs,
  credentials, or tokens to code, package metadata, README, or docs.
- Do not change the production profile, service, environment, or Hermes files
  without a separate explicit approval.
- Do not use force, no-verify, rsync, scp, or manual project copies.
- Do not touch the persistent dsh-lanmode test plugin.

## Build and test

- Build client: npm run build:client
- Unit tests: npm test
- Package validation: npm pack --dry-run
- Full registry/test-server and production checks follow the shared DSH
  release workflow and are recorded in Gitea issue/PR.

## Documentation

- Short navigation: index.md
- Detailed project documentation: docs/
- Migration plan: docs/plans/1-private-route.md

## Definition of done

- Tests and package identity checks pass.
- Test-server install uses a temporary package artifact, all applicable
  scenarios pass, and cleanup is recorded.
- Publication and production profile changes have the required explicit
  approvals and exact-version evidence.
- Gitea issue/PR, Memory Brain, and cleanup evidence are updated.
