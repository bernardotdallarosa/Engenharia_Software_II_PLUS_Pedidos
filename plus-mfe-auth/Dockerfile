FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_MS_AUTH_URL=http://localhost:3001
ENV VITE_MS_AUTH_URL=$VITE_MS_AUTH_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g vite
COPY --from=build /app/dist ./dist
EXPOSE 4001
CMD ["vite", "preview", "--port", "4001", "--host"]
