# Operations

## API outage

When API is unavailable, the Fabric Mod stores events under:

```text
config/ivrm-minecraft-activity/queue/events.jsonl
```

Run this command after API recovery:

```text
/ivrm admin flush
```

## Secret rotation

1. Add a new secret to API environment.
2. Update Minecraft server config.
3. Restart Minecraft server or run `/ivrm admin reload`.
4. Remove the old secret after confirming event delivery.

## Monthly ranking

Lunaria should post previous-month ranking on the first day of each month at 00:05 Asia/Tokyo.

## Failure tolerance

Minecraft gameplay must continue even when Activity API, member site, or Lunaria is unavailable.
