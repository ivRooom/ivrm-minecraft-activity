# Security Design

## Threat model

The API must reject forged Minecraft server events, duplicated reward claims, and dangerous reward commands.

## Minecraft server authentication

Every Mod -> API request includes:

```text
X-IVRM-Server-Id
X-IVRM-Timestamp
X-IVRM-Event-Id
X-IVRM-Signature
```

The signature uses HMAC-SHA256 with a per-server secret.

```text
METHOD + "\n" + PATH + "\n" + TIMESTAMP + "\n" + EVENT_ID + "\n" + BODY
```

## Validation requirements

| Check | Rule |
|---|---|
| server_id | Must exist and be enabled |
| timestamp | Must be within 5 minutes |
| event_id | Must be unique |
| signature | Must match HMAC-SHA256 |
| body | Must match schema |
| minecraft_uuid | Must be valid UUID string |

## Reward command safety

MVP command allowlist:

```text
give
```

Forbidden examples:

```text
op
deop
stop
ban
pardon
whitelist remove
kill
tp
summon
execute
function
```

## Secrets

- Do not commit server secrets.
- Store server secret in `config/ivrm-minecraft-activity/config.json` on the Minecraft server.
- Store API-side secrets in Cloud Run Secret Manager or equivalent.
- Use separate secrets per server_id.

## Failure policy

- API failure must not stop the Minecraft server.
- Failed events are saved to local queue.
- Queue entries are replayed with original event_id.
- Duplicate event_id must be ignored by API.
