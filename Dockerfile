# syntax=docker/dockerfile:1

FROM node:22-slim AS deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/reward-engine/package.json packages/reward-engine/package.json
COPY packages/ranking-engine/package.json packages/ranking-engine/package.json

RUN pnpm install --filter @ivrm/minecraft-activity-api --frozen-lockfile=false

FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN pnpm --filter @ivrm/minecraft-activity-api build

FROM node:22-slim AS prod-deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/reward-engine/package.json packages/reward-engine/package.json
COPY packages/ranking-engine/package.json packages/ranking-engine/package.json

RUN pnpm install --filter @ivrm/minecraft-activity-api --prod --frozen-lockfile=false

FROM node:22-slim AS runtime
WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json

EXPOSE 8080
CMD ["node", "dist/index.js"]
