# Operations

> **2026-10-26 maintenance / migration-source notice:** 本RepositoryのFabric 1.20.1、`ivrm-craft`、Lunaria、旧API/DBは歴史的な実装・移行資料です。現行のOrganization targetは、Producer `ivrm-mcmod`（NeoForge連携）、Contract `ivrm-contracts`、Canonical API `ivrm-web`、Canonical Data `Supabase/ivrm-core`、Monitoring `ivrm-dashboard` に責務を分離します。**この文書だけを現行本番サーバー設定・API/DB適用手順と解釈しないでください。** 機能移管・本番稼働の進捗は関連各Repo/Issue/Providerで個別確認します。[Platform Target Architecture](https://github.com/ivRooom/ivrm-platform/blob/main/docs/minecraft-integration-architecture.md) / [Contract](https://github.com/ivRooom/ivrm-contracts/blob/main/docs/MINECRAFT-ACTIVITY-V1.md)。

## API outage

When API is unavailable, the Fabric Mod stores events under:

```text
config/ivrm-minecraft-activity/queue/events.jsonl
```

Run this command after API recovery:

```text
/ivrm admin flush
```

## Secret rotation

1. Add a new secret to API environment.
2. Update Minecraft server config.
3. Restart Minecraft server or run `/ivrm admin reload`.
4. Remove the old secret after confirming event delivery.

## Monthly ranking

Lunaria should post previous-month ranking on the first day of each month at 00:05 Asia/Tokyo.

## Failure tolerance

Minecraft gameplay must continue even when Activity API, member site, or Lunaria is unavailable.
