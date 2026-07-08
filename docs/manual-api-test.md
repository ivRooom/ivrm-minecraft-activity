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

## Internal Web API Routing

```text
GET /v1/minecraft/internal/admin/players
```

Without `X-IVRM-Internal-Secret`, the endpoint should return HTTP 401:

```json
{ "ok": false, "error": "unauthorized" }
```

With a valid `X-IVRM-Internal-Secret`, the request should reach the internal API handler.
Minecraft HMAC headers are not used for `/v1/minecraft/internal/*`.

Public Minecraft endpoints should still require HMAC headers. For example,
`POST /v1/minecraft/events/login` and `GET /v1/minecraft/rewards/pending`
without HMAC headers should return HTTP 401:

```json
{ "ok": false, "error": "missing_signature_headers" }
```
