# Requirements

## Project

IVRM Minecraft Activity は、Fabric Minecraft サーバー上の活動を記録し、`api.ivrm.jp`、`member.ivrm.jp`、`admin.ivrm.jp`、Lunaria と連携するシステムである。

## Server baseline

| Item | Value |
|---|---|
| Minecraft | 1.20.1 |
| Mod Loader | Fabric Loader 0.19.3 |
| Fabric API | 0.92.9+1.20.1 |
| Java | 17 |
| Modpack | 自作 |
| Server ID | `ivrm-craft` |
| Display Name | いゔる。ーむ くらふと |
| Future Target | Paper / Forge / NeoForge |

## MVP scope

- Fabric サーバー専用 Mod として動作する。
- クライアント導入は不要にする。
- ログイン、ログアウト、heartbeat、初参加日時を記録する。
- heartbeat 間隔は 5 分とする。
- AFK は 15 分無操作で判定し、ランキング用プレイ時間から除外する。
- 未連携ユーザーのログは保存する。
- 報酬、ランキング、表彰ロール対象は Discord 連携済みユーザーのみとする。
- デイリー報酬は無料の 1 日 1 回ランダム報酬とする。
- 連続ログイン報酬、累計プレイ時間報酬、月間ランキングを扱う。
- 月間ランキング Top 5 を Lunaria が Discord に投稿する。

## Event scope

| Event | Phase | Notes |
|---|---:|---|
| Login | 1 | セッション開始 |
| Logout | 1 | セッション終了 |
| Heartbeat | 1 | 5分ごと |
| First join | 1 | UUID単位 |
| AFK start/end | 1 | 15分無操作 |
| Death count | 2 | 件数集計 |
| Advancement | 2 | IDと件数 |
| Chat count | 2 | 本文は保存しない |
| Block place/break | 2 | まとめて送信 |
| Dimension time | 2 | heartbeatで補完 |

## Reward scope

- Daily random reward: Common 70%、Uncommon 22%、Rare 7%、Legendary 1%。
- Streak rewards: 3日、7日、30日、90日、180日、365日、2年、3年、4年、5年以降。
- Playtime rewards: 1h、5h、10h、25h、50h、100h、250h、500h、1000h、2000h、5000h。
- 報酬は server_id 単位で切り替え可能にする。
- 報酬コマンドは admin.ivrm.jp で編集できる設計にする。
- インベントリ満杯対策としてメールボックス方式を採用する。

## Non-goals

- 独自アイテム、独自ブロック、独自GUIは作らない。
- Minecraft サーバーの起動停止管理は対象外。
- ランダム報酬は無料のゲーム内演出に限定し、外部決済や有償ポイントとは連携しない。
