FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_MS_AUTH_URL=http://localhost:3001
ENV VITE_MS_AUTH_URL=$VITE_MS_AUTH_URL
ARG MFE_AUTH_URL=http://localhost:4001/assets/remoteEntry.js
ENV MFE_AUTH_URL=$MFE_AUTH_URL
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
RUN npm install -g vite@5.4.21
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["vite", "preview", "--port", "3000", "--host", "0.0.0.0"]
