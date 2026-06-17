# Discord and Whitelist Linking

## Policy

- Activity logs are stored for all players.
- Rewards and public rankings are limited to Discord-linked players.
- Whitelist integration is handled through `api.ivrm.jp` and member/admin flows.

## Web flow

```text
Discord login
  -> member.ivrm.jp Minecraft ID registration
  -> API resolves Minecraft UUID
  -> link code generated
  -> player runs /ivrm link <code>
  -> account linked
  -> whitelist approved or requested
```

## Discord command flow

```text
/minecraft link <minecraft_id>
  -> Lunaria asks API to create link code
  -> player confirms in Minecraft
```
