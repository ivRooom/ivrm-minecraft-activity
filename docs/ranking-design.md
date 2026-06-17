# Ranking Design

## Ranking policy

- Ranking対象は Discord連携済みユーザーのみ。
- 未連携ユーザーのログは保存するが、公開ランキングには出さない。
- 有効プレイ時間は AFK時間を除外する。
- Discord投稿は Top 5。
- member.ivrm.jp では全順位と自分の順位を表示する。

## Ranking types

| Type | Metric |
|---|---|
| monthly_playtime | 月間有効プレイ時間 |
| monthly_login_days | 月間ログイン日数 |
| login_streak | 連続ログイン日数 |
| total_playtime | 累計有効プレイ時間 |

## Monthly snapshot

月間ランキングは毎月1日 00:05 Asia/Tokyo に前月分を集計する。

```text
2026-07-01 00:05 JST
  -> aggregate 2026-06
  -> create ranking snapshot
  -> Lunaria posts Discord embed
  -> award roles are updated
```

## Discord post format

```text
🏆 IVRM Minecraft 月間ランキング - 2026年6月

🥇 1位 ivuruGG
有効プレイ時間: 52時間10分
ログイン日数: 21日

🥈 2位 D0Deuce
有効プレイ時間: 48時間30分
ログイン日数: 19日

🥉 3位 MiMikinnTV
有効プレイ時間: 42時間15分
ログイン日数: 18日

4位 xxxx
5位 xxxx

詳細ランキング
https://member.ivrm.jp/minecraft/ranking/2026-06
```

## Award roles

| Condition | Role example |
|---|---|
| monthly_playtime rank 1 | Minecraft Monthly Champion |
| monthly_login_days rank 1 | Craft Streak Master |
| login_streak rank 1 | Login Legend |
| total_playtime >= 1000h | 1000h Crafter |

Monthly roles should be replaced each month. Permanent milestone roles should not be removed automatically.
