# Environment Variables

## API

| Name | Required | Description |
|---|---:|---|
| PORT | no | Cloud Run uses this. Default: 8080 |
| IVRM_SERVER_SECRET | yes for local | Fallback server secret |
| IVRM_SERVER_SECRET_IVRM_CRAFT | yes for production | Secret for `ivrm-craft` |

## Fabric Mod config

The Fabric Mod reads:

```text
config/ivrm-minecraft-activity/config.json
```

Important fields:

| Field | Description |
|---|---|
| server.id | `ivrm-craft` |
| api.baseUrl | `https://api.ivrm.jp` |
| api.serverSecret | per-server shared secret |
| heartbeat.intervalSeconds | default 300 |
| afk.thresholdSeconds | default 900 |
