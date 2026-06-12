FROM node:24-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN rm -rf dist && npm run build

FROM node:24-slim AS production

# Install curl for healthchecks
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

EXPOSE 3201

CMD ["node", "dist/src/main"]
