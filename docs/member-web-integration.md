# member.ivrm.jp / admin.ivrm.jp Integration

## Repository boundary

UI pages should live in `ivrm-web`.

This repository owns:

- API contracts
- Activity API implementation
- Mod implementation
- reward and ranking domain logic

## Integration flow

```text
member.ivrm.jp / admin.ivrm.jp
  -> ivrm-web server-side API route
  -> Minecraft Activity internal API
  -> Supabase PostgreSQL
```

`ivrm-web` must not access the Minecraft Activity database directly.

## Internal API

The Minecraft Activity API exposes server-to-server read endpoints under:

```text
/v1/minecraft/internal
```

See `docs/internal-web-api.md` for endpoint details.

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

`ivrm-web` should call `https://api.ivrm.jp` from the server side and include the internal API secret header.
