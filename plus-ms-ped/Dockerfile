FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY openapi ./openapi
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/openapi ./openapi
ENV PORT=3007
EXPOSE 3007
CMD ["node", "dist/server.js"]
