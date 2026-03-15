FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies needed for some native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3100
ENV PORT=3100

CMD ["node", "dist/server.js"]
