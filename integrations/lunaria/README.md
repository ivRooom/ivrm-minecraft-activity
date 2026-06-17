# Lunaria Integration

Lunaria は Minecraft Activity API からランキングと表彰対象を取得し、Discordに投稿する。

## Monthly ranking flow

```text
毎月1日 00:05 Asia/Tokyo
  -> GET /v1/lunaria/minecraft/monthly-ranking
  -> Discord Embed 投稿
  -> POST /v1/lunaria/minecraft/monthly-ranking/posted
  -> GET /v1/lunaria/minecraft/award-roles
  -> Discord ロール付与/更新
  -> POST /v1/lunaria/minecraft/award-roles/ack
```

## Commands

```text
/ranking minecraft monthly
/ranking minecraft monthly year_month:2026-06
/ranking minecraft post year_month:2026-06
```

## Embed policy

- Discord投稿は Top 5。
- 詳細は member.ivrm.jp のランキングページへ誘導する。
- 月間ロールは毎月更新する。
- 累計プレイ時間などのマイルストーンロールは永続にする。
