# @goodandready-private/dsh-key-limits

DSH web plugin: quota limits by API keys / subscriptions only.

| Surface | Click |
|---------|-------|
| Draggable float chip | All subscriptions' limits |
| Composer bar button | Active session subscription only |
| Settings -> Plugins card | Add / refresh / delete keys |

No spend ledger, charts, or Command Center.

Data: ~/.dsh/storages/dsh-key-limits/

## Install

Install the published private package at the exact version approved for the
deployment:

    dsh plugin --profile web add @goodandready-private/dsh-key-limits@<version>

Production must use the published package from GitHub Packages. Do not install
this plugin from a source directory or worktree.

## Develop

    npm run build:client
    npm test

Client source: src/client/ -> lib/client.js.
