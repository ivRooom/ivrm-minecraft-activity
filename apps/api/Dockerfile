# Official Node.js 22.23.4 (Oct 2026 security release), multiarch digest
FROM node:22.23.4-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS deps
RUN test "$(node --version)" = "v22.23.4"
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @ivrm/minecraft-activity-api --frozen-lockfile

# Official Node.js 22.23.4 (Oct 2026 security release), multiarch digest
FROM node:22.23.4-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS build
RUN test "$(node --version)" = "v22.23.4"
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @ivrm/minecraft-activity-api build

# Official Node.js 22.23.4 (Oct 2026 security release), multiarch digest
FROM node:22.23.4-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS runtime
RUN test "$(node --version)" = "v22.23.4"
# Preserve pnpm's original workspace-relative symlinks and their shared store.
# Relocating apps/api/node_modules to /app/node_modules would break link targets.
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
USER node
CMD ["node", "dist/index.js"]
