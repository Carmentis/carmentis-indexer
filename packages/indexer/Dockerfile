FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --dangerously-allow-all-builds

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --dangerously-allow-all-builds
RUN pnpm --filter @cmts-dev/carmentis-indexer-common build
RUN pnpm --filter @cmts-dev/carmentis-indexer build

FROM node:22-slim AS runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages/indexer/node_modules ./packages/indexer/node_modules
COPY --from=build /app/packages/common/dist ./packages/common/dist
COPY --from=build /app/packages/indexer/dist ./packages/indexer/dist
COPY --from=build /app/packages/common/package.json ./packages/common/package.json
COPY --from=build /app/packages/indexer/package.json ./packages/indexer/package.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
WORKDIR /app/packages/indexer
EXPOSE 3000
CMD ["node", "dist/main"]