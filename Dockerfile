# syntax=docker/dockerfile:1

FROM node:24-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies (postinstall runs `prisma generate`, so the schema must be present).
FROM base AS deps
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# The Prisma CLI and tsx are kept so the container can migrate and seed its database on start.
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed -- --if-empty && exec npx next start -H 0.0.0.0 -p 3000"]
