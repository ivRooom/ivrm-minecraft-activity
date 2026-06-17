# CI Notes

## Current workflows

- Project Checks

Project Checks includes API Typecheck and Fabric Build.

## Fabric Build

Runtime:

```text
Java 17
Gradle 8.12.1
```

Command:

```bash
gradle build
```

## Pending workflows

- API unit tests
- Docker image build

## Notes

Fabric Loom needs Gradle 8.12 or newer. Gradle wrapper will be added after this build setup is stable.
