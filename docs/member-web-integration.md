# member.ivrm.jp / admin.ivrm.jp Integration

## Repository boundary

UI pages should live in `ivrm-web`.

This repository owns:

- API contracts
- Activity API implementation
- Mod implementation
- reward and ranking domain logic

## member pages

```text
/member/minecraft
/member/minecraft/activity
/member/minecraft/rewards
/member/minecraft/ranking
```

## admin pages

```text
/admin/minecraft/players
/admin/minecraft/sessions
/admin/minecraft/rewards
/admin/minecraft/rankings
/admin/minecraft/settings
```

## API client

`ivrm-web` should call `https://api.ivrm.jp` and should not directly access Minecraft server internals.
