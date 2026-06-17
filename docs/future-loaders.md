# Future Loader Support

Start with Fabric server-only Mod and keep the API payload design portable for later Paper, Forge, and NeoForge support.

## Future layout

```text
mods/fabric
plugins/paper
mods/neoforge
packages/shared-types
packages/reward-engine
packages/ranking-engine
```

## Rules

- Event payload schemas stay loader-neutral.
- API authentication stays the same across loaders.
- Reward rules are API-managed.
- Loader-specific code only collects events and executes safe delivery commands.
