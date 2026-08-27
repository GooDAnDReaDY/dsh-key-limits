# @goodandready/dsh-key-limits

DSH web plugin: **quota limits by API keys / subscriptions only**.

| Surface | Click |
|---------|-------|
| Draggable float chip | All subscriptions' limits |
| Composer bar button | Active session subscription only |
| Settings → Plugins card | Add / refresh / delete keys |

No spend ledger, charts, or Command Center.

Data: `~/.dsh/storages/dsh-key-limits/`

## Install (staging)

```sh
dsh plugin --profile web add file:/mnt/external/Project/DEV/dsh-key-limits
sudo systemctl restart dsh-web
```

Or: `bash scripts/deploy-staging.sh`

## Develop

```sh
npm run build:client
npm test
```

Client source: `src/client/` → `lib/client.js`.
