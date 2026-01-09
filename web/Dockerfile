FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm install

FROM base AS builder
WORKDIR /app
# We copy the base config to both root and web directories to support 
# volume mounting and the build process.
COPY tsconfig.base.json /app/tsconfig.base.json
COPY tsconfig.base.json /app/web/tsconfig.base.json

WORKDIR /app/web
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .

# We patch tsconfig.json to reference the local base config for the build.  
RUN sed -i 's|../tsconfig.base.json|./tsconfig.base.json|' tsconfig.json && grep -q '"extends": "./tsconfig.base.json"' tsconfig.json

RUN npm run build

FROM base AS runner
WORKDIR /app/web
ENV NODE_ENV production

ENV NEXT_TELEMETRY_DISABLED 1

# We create a non-root user for security.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/web/public ./public

# We need to ensure the non-root user has permissions for the prerender cache.
RUN mkdir .next
RUN chown nextjs:nodejs .next

# We copy the standalone build to reduce image size.
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# We set the hostname to listen on all interfaces.
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
