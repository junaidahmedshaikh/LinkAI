FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
RUN npm ci --workspace=@linkai/server --include-workspace-root
COPY packages/types ./packages/types
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
RUN npm run build -w @linkai/types && npm run build -w @linkai/shared && npm run build -w @linkai/server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
WORKDIR /app/apps/server
EXPOSE 5000
CMD ["node", "dist/server.js"]
