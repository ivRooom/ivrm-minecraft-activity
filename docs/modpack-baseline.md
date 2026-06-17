# Modpack Baseline

## Runtime target

- Minecraft: 1.20.1
- Fabric Loader: 0.19.3
- Fabric API: 0.92.9+1.20.1
- Java: 17
- Server ID: `ivrm-craft`
- Display name: いゔる。ーむ くらふと

## Design implication

The Mod must stay server-only and avoid adding custom items, blocks, or client-required assets.

Activity data is sent to API asynchronously and must not block the server tick thread.

## Resource policy

The target server is small community scale. Heavy aggregation and ranking logic belongs to the API/DB layer, not the Minecraft server process.

## Selected event strategy

- Send login/logout immediately.
- Send heartbeat every 5 minutes.
- Batch high-frequency counters before API delivery.
- Use local queue when API is unavailable.
