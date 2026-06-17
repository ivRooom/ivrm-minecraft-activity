# Architecture

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
