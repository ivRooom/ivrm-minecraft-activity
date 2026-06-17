# Roadmap

## Phase 1: Fabric Mod MVP

- `/ivrm status`
- config load
- login event
- logout event
- heartbeat
- basic AFK detection
- HMAC-SHA256 signature
- local retry queue

## Phase 2: API MVP

- Hono/Fastify API scaffold
- event ingest endpoints
- signature verification
- session persistence
- daily/monthly aggregation
- Discord linked account check

## Phase 3: Rewards

- daily random reward
- streak reward
- playtime reward
- mailbox claim flow
- reward delivery ack
- admin reward schema

## Phase 4: Web integration

- member.ivrm.jp activity page
- member.ivrm.jp reward history
- ranking page
- admin.ivrm.jp reward management
- admin.ivrm.jp player/session view

## Phase 5: Lunaria integration

- monthly ranking fetch
- Discord embed post
- award role target fetch
- award role ack
- manual repost command

## Phase 6: Multi-loader support

- shared Java core extraction
- Paper plugin
- NeoForge/Forge support
- server-specific reward pools
