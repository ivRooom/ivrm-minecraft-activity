# Testing Strategy

## Fabric Mod

Initial checks:

```bash
cd mods/fabric
gradle build
```

Runtime checks on a local test server:

```text
/ivrm status
/ivrm admin reload
/ivrm admin flush
```

Expected behavior:

- config file is generated on first startup
- login/logout events are sent asynchronously
- API failure writes JSONL queue entries
- server gameplay continues when API is unavailable

## API

```bash
pnpm install
pnpm api:typecheck
pnpm api:dev
```

Expected behavior:

- `GET /healthz` returns `{ ok: true }`
- event endpoints reject missing HMAC headers
- event endpoints reject stale timestamps
- event endpoints accept valid signed requests
