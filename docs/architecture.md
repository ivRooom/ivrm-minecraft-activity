# Architecture

> **2026-10-26 maintenance / migration-source notice:** 本RepositoryのFabric 1.20.1、`ivrm-craft`、Lunaria、旧API/DBは歴史的な実装・移行資料です。現行のOrganization targetは、Producer `ivrm-mcmod`（NeoForge連携）、Contract `ivrm-contracts`、Canonical API `ivrm-web`、Canonical Data `Supabase/ivrm-core`、Monitoring `ivrm-dashboard` に責務を分離します。**この文書だけを現行本番サーバー設定・API/DB適用手順と解釈しないでください。** 機能移管・本番稼働の進捗は関連各Repo/Issue/Providerで個別確認します。[Platform Target Architecture](https://github.com/ivRooom/ivrm-platform/blob/main/docs/minecraft-integration-architecture.md) / [Contract](https://github.com/ivRooom/ivrm-contracts/blob/main/docs/MINECRAFT-ACTIVITY-V1.md)。

## Overview

```text
Minecraft Fabric Server
  └─ IVRM Minecraft Activity Mod
      ├─ event tracking
      ├─ AFK detection
      ├─ local retry queue
      └─ reward claim command

api.ivrm.jp
  └─ Activity API
      ├─ signature verification
      ├─ event ingest
      ├─ session aggregation
      ├─ reward engine
      ├─ ranking API
      └─ Lunaria integration

member.ivrm.jp / admin.ivrm.jp
  └─ Activity dashboard and reward management

Lunaria
  └─ monthly ranking post and award roles
```

## Responsibility split

| Component | Responsibility |
|---|---|
| Fabric Mod | イベント検知、AFK判定、API送信、ローカルキュー、報酬受取コマンド |
| API | 署名検証、DB保存、集計、報酬判定、ランキング生成 |
| member.ivrm.jp | ユーザー向け活動履歴、報酬履歴、ランキング表示 |
| admin.ivrm.jp | 報酬設定、プレイヤー確認、再集計、運用管理 |
| Lunaria | Discord投稿、表彰ロール付与、手動再投稿 |

## Server Mod policy

この Mod は `environment: server` の Fabric サーバー専用 Mod として実装する。独自アイテムや独自GUIは作らず、クライアント必須要素を避ける。

## Event delivery

1. Mod がイベントを検知する。
2. Mod が `event_id` を生成する。
3. HMAC-SHA256 署名付きで API に送信する。
4. API が重複イベントを無視できるように `event_id` を保存する。
5. API 障害時は Mod が JSON Lines キューに保存する。
6. 復旧後、`/ivrm admin flush` または自動フラッシュで再送する。

## Performance policy

- HTTP通信は Minecraft メインスレッドで実行しない。
- heartbeat は 5分間隔にする。
- block place / break は即時送信せず、短時間で集約して送信する。
- 集計は API 側で実行する。
- API の障害で Minecraft サーバーを止めない。
