# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy manifests first for better layer caching
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --filter "@fitnessapp/server..." || \
    pnpm install --filter "@fitnessapp/server..."

# Copy sources
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

RUN pnpm --filter @fitnessapp/server build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build /repo/apps/server/package.json apps/server/
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/apps/server/dist apps/server/dist

RUN pnpm install --prod --filter @fitnessapp/server

USER node
EXPOSE 4000
CMD ["node", "apps/server/dist/server.js"]
