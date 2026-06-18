# API Design

Base URL: `https://api.ivrm.jp`

## Authentication

Minecraft server requests must include:

```text
X-IVRM-Server-Id: ivrm-craft
X-IVRM-Timestamp: 2026-06-17T00:00:00+09:00
X-IVRM-Event-Id: evt_xxxxx
X-IVRM-Signature: hex_hmac_sha256
```

Signature payload:

```text
METHOD + "\n" + PATH + "\n" + TIMESTAMP + "\n" + EVENT_ID + "\n" + BODY
```

## Minecraft Mod endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/minecraft/events/login` | login event |
| POST | `/v1/minecraft/events/logout` | logout event |
| POST | `/v1/minecraft/events/heartbeat` | heartbeat |
| POST | `/v1/minecraft/events/afk` | AFK start/end |
| POST | `/v1/minecraft/events/player-stat` | death/chat/block/advancement counters |
| POST | `/v1/minecraft/rewards/daily-random/draw` | daily free random reward draw |
| GET | `/v1/minecraft/rewards/pending?serverId=ivrm-craft&uuid=...` | pending rewards |
| POST | `/v1/minecraft/rewards/ack` | reward delivery ack |
| GET | `/v1/minecraft/server-config/ivrm-craft` | server-specific config |

## member.ivrm.jp endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/me/minecraft/profile` | link status |
| GET | `/v1/me/minecraft/activity` | own activity |
| GET | `/v1/me/minecraft/rewards` | reward history |
| GET | `/v1/me/minecraft/random-reward-history` | daily random reward history |
| GET | `/v1/me/minecraft/rank` | own rank |
| GET | `/v1/minecraft/rankings/monthly` | monthly ranking |
| GET | `/v1/minecraft/rankings/streak` | streak ranking |

## admin.ivrm.jp endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/admin/minecraft/players` | player list |
| GET | `/v1/admin/minecraft/sessions` | session list |
| GET | `/v1/admin/minecraft/rewards` | reward rules |
| POST | `/v1/admin/minecraft/rewards` | create reward rule |
| PATCH | `/v1/admin/minecraft/rewards/{id}` | update reward rule |
| POST | `/v1/admin/minecraft/rankings/recalculate` | recalculate rankings |

## Lunaria endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/lunaria/minecraft/monthly-ranking?yearMonth=2026-06&serverId=ivrm-craft` | monthly ranking |
| POST | `/v1/lunaria/minecraft/monthly-ranking/posted` | mark posted |
| GET | `/v1/lunaria/minecraft/award-roles?yearMonth=2026-06` | role targets |
| POST | `/v1/lunaria/minecraft/award-roles/ack` | mark role applied |

## Login request example

```json
{
  "serverId": "ivrm-craft",
  "minecraftUuid": "00000000-0000-0000-0000-000000000000",
  "minecraftName": "ivuruGG",
  "joinedAt": "2026-06-17T21:00:00+09:00"
}
```

## Login response example

```json
{
  "ok": true,
  "sessionId": "sess_01J...",
  "linked": true,
  "pendingRewardCount": 1
}
```

## Daily random reward draw request example

```json
{
  "serverId": "ivrm-craft",
  "minecraftUuid": "00000000-0000-0000-0000-000000000000",
  "minecraftName": "ivuruGG"
}
```

## Daily random reward draw response example

```json
{
  "ok": true,
  "alreadyDrawn": false,
  "drawDate": "2026-06-18",
  "rewardGrantId": "00000000-0000-0000-0000-000000000000",
  "reward": {
    "rarity": "common",
    "rewardName": "パン 8個",
    "probability": "20.000",
    "status": "granted"
  }
}
```

If the Minecraft account is not linked to Discord, the API returns:

```json
{
  "ok": false,
  "error": "discord_link_required",
  "drawDate": "2026-06-18"
}
```

The draw API creates a pending `minecraft_reward_grants` row. Actual delivery is handled by the rewards claim/ack flow in a later phase.
