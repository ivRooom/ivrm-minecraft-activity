# Reward Design

## Policy

- Rewards are available only to Discord-linked Minecraft accounts.
- Unlinked users are logged but cannot claim rewards.
- Rewards are managed by API/admin and delivered by the Fabric Mod.
- Rewards are server-specific by `server_id`.
- Daily random reward is free, once per day, and game-item-only.

## Reward types

| Type | Description |
|---|---|
| daily_random | 1日1回の無料ランダム報酬 |
| login_streak | 連続ログイン日数報酬 |
| playtime_total | 累計有効プレイ時間報酬 |
| monthly_ranking | 月間ランキング報酬 |
| manual | 運営手動付与 |

## Daily random reward rates

| Rarity | Weight | Example |
|---|---:|---|
| Common | 70 | food, torch, coal |
| Uncommon | 22 | iron, copper, Create materials |
| Rare | 7 | emerald, golden apple |
| Legendary | 1 | diamond, rare mod material |

## Example pool

```json
{
  "serverId": "ivrm-craft",
  "type": "daily_random",
  "enabled": true,
  "resetTime": "00:00",
  "timezone": "Asia/Tokyo",
  "drawLimitPerDay": 1,
  "requireDiscordLink": true,
  "pools": [
    {
      "rarity": "common",
      "weight": 70,
      "items": [
        {
          "name": "パン 8個",
          "commands": ["give {player} minecraft:bread 8"]
        }
      ]
    },
    {
      "rarity": "legendary",
      "weight": 1,
      "items": [
        {
          "name": "ダイヤモンド 1個",
          "commands": ["give {player} minecraft:diamond 1"]
        }
      ]
    }
  ]
}
```

## Streak rewards

```text
3 days
7 days
30 days
90 days
180 days
365 days
2 years
3 years
4 years
5 years
```

A day counts when the player logs in at least once in Asia/Tokyo.

## Playtime rewards

```text
1h
5h
10h
25h
50h
100h
250h
500h
1000h
2000h
5000h
```

Playtime rewards use active_seconds, excluding AFK time.

## Mailbox flow

```text
Reward generated
  -> reward_grant status=pending
  -> player runs /ivrm rewards claim
  -> mod fetches pending rewards
  -> mod executes allowed commands
  -> mod sends ack
  -> reward_grant status=delivered
```

## Command allowlist

MVP allows only `give`. Later phases can add `title`, `tellraw`, `effect`, and role-related actions through Lunaria.
