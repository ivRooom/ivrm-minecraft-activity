# Internal Web API for ivrm-web

This document defines read-only API endpoints used by `ivrm-web` for `member.ivrm.jp` and `admin.ivrm.jp`.

## Authentication

Requests must be server-to-server and must include this header:

```text
X-IVRM-Internal-Secret: <shared secret>
```

The secret is configured by `IVRM_INTERNAL_API_SECRET` on the Minecraft Activity API side.

Browser clients must not call these endpoints directly.

## Base path

```text
/v1/minecraft/internal
```

## Member endpoints

```text
GET /v1/minecraft/internal/member/{minecraftUuid}/overview?serverId=ivrm-craft&yearMonth=2026-06
GET /v1/minecraft/internal/member/{minecraftUuid}/rewards?serverId=ivrm-craft&status=pending
```

`overview` returns account link state, monthly activity stats, recent reward grants, and recent daily random reward draws.

`rewards` returns reward grants for the selected player. `status` is optional.

## Admin endpoints

```text
GET /v1/minecraft/internal/admin/players?serverId=ivrm-craft
GET /v1/minecraft/internal/admin/rewards?serverId=ivrm-craft&status=pending
```

`players` returns Minecraft account rows with Discord link state and session summary.

`rewards` returns reward grants across players. `status` is optional.

## Status values

```text
pending
delivered
expired
cancelled
```

## ivrm-web responsibility

`ivrm-web` should expose user-facing routes such as:

```text
/v1/me/minecraft/profile
/v1/me/minecraft/activity
/v1/me/minecraft/rewards
/v1/admin/minecraft/players
/v1/admin/minecraft/rewards
```

Those routes should validate Discord session/admin role first, resolve the user's linked Minecraft UUID, and then call these internal endpoints from the server side.
