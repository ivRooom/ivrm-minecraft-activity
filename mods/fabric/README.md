# Fabric Mod

Server-side Fabric Mod for IVRM Minecraft Activity.

## Target

- Minecraft 1.20.1
- Fabric Loader 0.19.3
- Fabric API 0.92.9+1.20.1
- Java 17

## Commands

```text
/ivrm status
/ivrm rewards
/ivrm rewards claim
/ivrm rewards claim all
/ivrm reward-help
/ivrm admin reload
/ivrm admin flush
```

## Reward claim flow

```text
/ivrm rewards
  -> show pending rewards

/ivrm rewards claim
  -> deliver the oldest pending reward
  -> send ack to API
  -> reward_grant status=delivered

/ivrm rewards claim all
  -> deliver all pending rewards returned by API
```

MVP delivery executes only API-allowlisted `give {player} ...` commands.

## Config

The config file is generated on first server start:

```text
config/ivrm-minecraft-activity/config.json
```

Set `api.serverSecret` before connecting to production API.
