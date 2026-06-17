# IVRM Minecraft Activity

IVRM の Minecraft サーバー活動記録・報酬・ランキング連携システムです。

このリポジトリでは、Fabric サーバー専用 Mod、`api.ivrm.jp` 向け Activity API、報酬・ランキング設計、Lunaria 連携仕様を管理します。

## Scope

- Minecraft 1.20.1 / Fabric Loader 0.19.3 / Fabric API 0.92.9+1.20.1 / Java 17
- サーバーID: `ivrm-craft`
- Discord連携済みユーザー向け報酬・ランキング
- 未連携ユーザーの活動ログ保存
- member.ivrm.jp / admin.ivrm.jp / Lunaria 連携

## Repository Layout

```text
apps/api              api.ivrm.jp 向け Activity API
mods/fabric           Fabric サーバー専用 Mod
packages/shared-types API/Mod/Web/Bot 共通型
packages/reward-engine 報酬判定ロジック
packages/ranking-engine ランキング集計ロジック
integrations/lunaria  Lunaria 連携仕様
docs                  要件・設計・運用ドキュメント
```

## Development Status

Initial project setup in progress.
