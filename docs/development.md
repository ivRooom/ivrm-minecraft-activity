# Development

## Fabric Mod

```bash
cd mods/fabric
gradle build
```

The repository does not include a Gradle wrapper yet. Add `gradlew` in a later task after confirming the Fabric Loom version used in the target development environment.

## API

```bash
pnpm install
pnpm api:dev
pnpm api:typecheck
```

## Local config

The Fabric Mod creates this file on first startup:

```text
config/ivrm-minecraft-activity/config.json
```

Set `api.serverSecret` before connecting to a real API environment.

## Environment variables

```text
PORT=8080
IVRM_SERVER_SECRET=change-me
IVRM_SERVER_SECRET_IVRM_CRAFT=change-me
```
