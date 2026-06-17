# Manual API Test

## Environment

```text
IVRM_SERVER_SECRET=change-me
PORT=8080
```

## Target

```text
POST /v1/minecraft/events/login
```

## Headers

```text
X-IVRM-Server-Id
X-IVRM-Timestamp
X-IVRM-Event-Id
X-IVRM-Signature
```

A script-based test should be added after API persistence is implemented.
