FROM node:25-alpine AS builder
WORKDIR /app
COPY tsconfig.base.json .
WORKDIR /app/realtime
COPY realtime/package*.json ./
RUN npm install
COPY realtime/ .
RUN npm run build

FROM node:25-alpine
WORKDIR /app/realtime
COPY realtime/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/realtime/dist ./dist
EXPOSE 1234
CMD ["npm", "start"]
