# Development

## Fabric Mod

Local build target:

```bash
cd mods/fabric
gradle build
```

Recommended local tools:

```text
Java 17
Gradle 8.10.2
```

The GitHub Actions Fabric Build workflow uses `gradle/actions/setup-gradle` with Gradle 8.10.2. A Gradle wrapper can be added after the Loom/Gradle combination is validated in CI.

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
