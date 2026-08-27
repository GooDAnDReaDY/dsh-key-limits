# dsh-key-limits

Private DeepSeek Harness web plugin for API-key and subscription quota limits.

- Package: @goodandready-private/dsh-key-limits
- Source: canonical DEV project
- Host entry point: lib/index.js
- Browser bundle: lib/client.js, built from src/client/
- Bundle patch: cordis.patch.yml
- Build: npm run build:client
- Tests: npm test
- Package validation: npm pack --dry-run
- Detailed docs: docs/
- Migration plan: docs/plans/1-private-route.md

Production uses only the exact package version published to the private
registry. Source-directory installation is not supported.
