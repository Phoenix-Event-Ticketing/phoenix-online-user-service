FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

FROM base AS runner
ENV NODE_ENV=production
ENV MIGRATE_ON_START=false

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
COPY scripts ./scripts
COPY docs ./docs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "src/server.js"]