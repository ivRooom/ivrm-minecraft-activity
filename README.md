# IVRM Minecraft Activity

> **2026-10-26 maintenance / migration-source notice:** 本RepositoryのFabric 1.20.1、`ivrm-craft`、Lunaria、旧API/DBは歴史的な実装・移行資料です。現行のOrganization targetは、Producer `ivrm-mcmod`（NeoForge連携）、Contract `ivrm-contracts`、Canonical API `ivrm-web`、Canonical Data `Supabase/ivrm-core`、Monitoring `ivrm-dashboard` に責務を分離します。**この文書だけを現行本番サーバー設定・API/DB適用手順と解釈しないでください。** 機能移管・本番稼働の進捗は関連各Repo/Issue/Providerで個別確認します。[Platform Target Architecture](https://github.com/ivRooom/ivrm-platform/blob/main/docs/minecraft-integration-architecture.md) / [Contract](https://github.com/ivRooom/ivrm-contracts/blob/main/docs/MINECRAFT-ACTIVITY-V1.md)。

IVRM の Minecraft サーバー活動記録・報酬・ランキング連携システムです。

このリポジトリでは、Fabric サーバー専用 Mod、`api.ivrm.jp` 向け Activity API、報酬・ランキング設計、Lunaria 連携仕様を管理します。

## Scope

- Minecraft 1.20.1 / Fabric Loader 0.19.3 / Fabric API 0.92.9+1.20.1 / Java 17
- サーバーID: `ivrm-craft`
- Discord連携済みユーザー向け報酬・ランキング
- 未連携ユーザーの活動ログ保存
- member.ivrm.jp / admin.ivrm.jp / Lunaria 連携

## Repository Layout

```text
apps/api              api.ivrm.jp 向け Activity API
mods/fabric           Fabric サーバー専用 Mod
packages/shared-types API/Mod/Web/Bot 共通型
packages/reward-engine 報酬判定ロジック
packages/ranking-engine ランキング集計ロジック
integrations/lunaria  Lunaria 連携仕様
docs                  要件・設計・運用ドキュメント
```

## Development Status

Initial project setup in progress.
