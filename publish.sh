#!/usr/bin/env bash
# publish.sh — publication layer for dsh-key-limits.
#
# The public tree is built from verified main without internal development
# files (AGENTS.md, index.md, docs/TZ.md, plans, staging deploy scripts, etc.).
#
# Modes:
#   bash publish.sh plan [ref]
#       Show composition of public tree and verify required files are present.
#
#   DSH_KEY_LIMITS_PUBLISH=yes bash publish.sh publish <ref> <version>
#       Create publication commit on top of current public GitHub main,
#       push branch main and tag v<version> via fast-forward.
#
# Does not enter npm package and does not modify production.

set -euo pipefail

MODE="${1:-}"
REF="${2:-origin/main}"
VERSION="${3:-}"

GITHUB_URL="https://github.com/GooDAnDReaDY/dsh-key-limits.git"
GITHUB_BRANCH="main"

EXCLUDED_PATHS=(
  "AGENTS.md"
  "index.md"
  "publish.sh"
  "docs/TZ.md"
  "docs/plans"
  "docs/superpowers"
  "docs/design"
  "scripts/deploy-staging.sh"
  "scripts/smoke-staging.sh"
  ".planning"
  ".worktrees"
)

REQUIRED_PATHS=(
  "package.json"
  "lib/index.js"
  "lib/client.js"
  "cordis.patch.yml"
  "README.md"
  "LICENSE"
)

fail() { echo "ERROR: $*" >&2; exit 1; }

build_public_tree() {
  local ref="$1"
  local index_file
  index_file="$(mktemp)"
  rm -f "$index_file"
  export GIT_INDEX_FILE="$index_file"

  git read-tree "$ref" || fail "cannot read the tree of $ref"
  local path
  for path in "${EXCLUDED_PATHS[@]}"; do
    git rm --cached -r -q --ignore-unmatch "$path" >/dev/null 2>&1 || true
  done
  local tree
  tree="$(git write-tree)" || fail "cannot write the public tree"
  unset GIT_INDEX_FILE
  rm -f "$index_file"
  printf '%s' "$tree"
}

verify_tree() {
  local tree="$1"
  local list
  list="$(git ls-tree -r --name-only "$tree")"

  local path
  for path in "${EXCLUDED_PATHS[@]}"; do
    if printf '%s\n' "$list" | grep -qx "$path" || printf '%s\n' "$list" | grep -q "^$path/"; then
      fail "excluded path is present in the public tree: $path"
    fi
  done
  for path in "${REQUIRED_PATHS[@]}"; do
    printf '%s\n' "$list" | grep -qx "$path" || fail "required file is missing from the public tree: $path"
  done

  printf '%s\n' "$list" | sort
}

case "$MODE" in
  plan)
    tree="$(build_public_tree "$REF")"
    echo "public tree for $REF (object $tree):"
    verify_tree "$tree" >/dev/null
    git ls-tree -r --name-only "$tree" | sort
    echo "plan: OK — no service files, all required product files present"
    ;;

  publish)
    [ "${DSH_KEY_LIMITS_PUBLISH:-}" = "yes" ] || fail "publication requires explicit owner approval: run with DSH_KEY_LIMITS_PUBLISH=yes"
    [ -n "$VERSION" ] || fail "usage: DSH_KEY_LIMITS_PUBLISH=yes bash publish.sh publish <ref> <version>"
    command -v gh >/dev/null 2>&1 || fail "gh CLI not found in PATH (needed for GitHub authentication)"

    tree="$(build_public_tree "$REF")"
    echo "public tree for $REF (object $tree):"
    verify_tree "$tree" >/dev/null
    git ls-tree -r --name-only "$tree" | sort
    echo "verification: no service files, all required product files present"

    git -c credential.helper='!gh auth git-credential' fetch "$GITHUB_URL" "$GITHUB_BRANCH" >/dev/null 2>&1 \
      || fail "cannot read the current public $GITHUB_BRANCH from GitHub"
    public_main="$(git rev-parse FETCH_HEAD)"
    echo "public $GITHUB_BRANCH is $public_main"

    commit="$(git commit-tree "$tree" -p "$public_main" -m "release: publish v$VERSION

Public tree for v$VERSION: the product files from the verified main without
internal development and staging files.")"
    echo "publication commit $commit"

    git -c credential.helper='!gh auth git-credential' push "$GITHUB_URL" "$commit:refs/heads/$GITHUB_BRANCH" \
      || fail "push of the publication commit failed"
    git tag -a "v$VERSION" "$commit" -m "v$VERSION — public release tree"
    git -c credential.helper='!gh auth git-credential' push "$GITHUB_URL" "refs/tags/v$VERSION" \
      || fail "push of the release tag failed"
    echo "published: $GITHUB_URL branch $GITHUB_BRANCH and tag v$VERSION -> $commit"
    ;;

  *)
    fail "usage: bash publish.sh plan [ref] | DSH_KEY_LIMITS_PUBLISH=yes bash publish.sh publish <ref> <version>"
    ;;
esac
