# Private registry migration

## Scope

Migrate dsh-key-limits from source-directory installation to the private
package @goodandready-private/dsh-key-limits.

## Required identity

The package name must match in package.json, cordis.patch.yml, and the
window ModuleLoader entry in lib/client.js.

## Release gates

1. Gitea issue and branch/worktree from current main.
2. Unit tests, client build, package dry-run, and metadata/path audit.
3. Temporary package-artifact install on the isolated DSH test server.
4. Health, routes, client bundle, functional scenarios, and cleanup.
5. Explicit owner approval before publication.
6. Exact private registry publication and GitHub release.
7. Explicit owner approval before production profile change.
8. Production health/routes/client checks, issue evidence, and branch/worktree
   cleanup.

## Non-goals

Do not migrate other plugins in this task, change Hermes configuration, or
alter the persistent test-server plugin.
