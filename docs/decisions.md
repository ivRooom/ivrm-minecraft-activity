# Decisions

## 2026-06-17: Repository split

`ivrm-minecraft-activity` manages Minecraft Activity core features.

`ivrm-web` should own member/admin UI pages and call `api.ivrm.jp`.

`lunaria` should own Discord Bot runtime and consume Lunaria integration endpoints.

## 2026-06-17: Mod strategy

Start with Fabric server-only Mod for Minecraft 1.20.1.

Future support for Paper / Forge / NeoForge should reuse shared concepts but does not need to block the Fabric MVP.

## 2026-06-17: Reward strategy

Daily random rewards are free game-item rewards. Reward command execution starts with a strict `give` command allowlist.

## 2026-06-17: AFK strategy

15 minutes without position/view changes is treated as AFK. AFK time is excluded from ranking playtime.
