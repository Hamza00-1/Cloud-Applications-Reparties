# ============================================
# CampusOps — Multi-Stage Docker Build
# ============================================

# ---------- Stage 1: Dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# ---------- Stage 2: Development ----------
FROM node:24-alpine AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/index.ts"]

# ---------- Stage 3: Build ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npx tsc
# Prune dev deps so the production image stays small.
RUN npm prune --omit=dev

# ---------- Stage 4: Production ----------
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Non-root runtime user
RUN addgroup -S app && adduser -S app -G app

# Copy only what's needed
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./

USER app
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run pending DB migrations on container start then boot the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
