# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /repo

RUN apk add --no-cache g++ make python3 \
    && corepack enable \
    && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/mobile/package.json apps/mobile/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY apps/mobile apps/mobile
COPY apps/server apps/server
COPY packages/shared packages/shared

RUN pnpm --filter @fitnessapp/shared build \
    && pnpm --filter @fitnessapp/server build

FROM build AS web-build
ARG EXPO_PUBLIC_API_URL=http://localhost:4000
ARG EXPO_PUBLIC_SOCKET_URL=http://localhost:4000
ARG EXPO_PUBLIC_DEFAULT_LOCALE=he
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_SOCKET_URL=$EXPO_PUBLIC_SOCKET_URL
ENV EXPO_PUBLIC_DEFAULT_LOCALE=$EXPO_PUBLIC_DEFAULT_LOCALE
RUN pnpm --filter @fitnessapp/mobile exec expo export --platform web

FROM node:20-alpine AS server-dependencies
WORKDIR /app

RUN apk add --no-cache g++ make python3 \
    && corepack enable \
    && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --prod --frozen-lockfile --filter "@fitnessapp/server..."

FROM node:20-alpine AS server
WORKDIR /app/apps/server
ENV NODE_ENV=production

COPY --from=server-dependencies /app/node_modules /app/node_modules
COPY --from=server-dependencies /app/apps/server/node_modules ./node_modules
COPY --from=server-dependencies /app/packages/shared/node_modules /app/packages/shared/node_modules
COPY --from=build /repo/apps/server/package.json ./
COPY --from=build /repo/apps/server/dist ./dist
COPY --from=build /repo/apps/server/src/db/migrations ./dist/src/db/migrations
COPY --from=build /repo/apps/server/src/db/seeds ./src/db/seeds
COPY --from=build /repo/packages/shared/package.json /app/packages/shared/
COPY --from=build /repo/packages/shared/dist /app/packages/shared/dist

USER node
EXPOSE 4000
CMD ["node", "dist/src/server.js"]

FROM nginx:1.27-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /repo/apps/mobile/dist /usr/share/nginx/html
EXPOSE 80
