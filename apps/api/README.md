# Activity API

Cloud Run-ready API scaffold for IVRM Minecraft Activity.

## Commands

```bash
pnpm install
pnpm api:dev
pnpm api:typecheck
```

## Health check

```text
GET /healthz
```

## Minecraft event endpoints

```text
POST /v1/minecraft/events/login
POST /v1/minecraft/events/logout
POST /v1/minecraft/events/heartbeat
POST /v1/minecraft/events/afk
POST /v1/minecraft/events/player-stat
```

All event endpoints require IVRM HMAC headers.
