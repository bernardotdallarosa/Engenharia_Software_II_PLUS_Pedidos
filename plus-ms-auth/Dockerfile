# FROM node:20-alpine AS deps
# WORKDIR /app
# COPY package.json package-lock.json* ./
# RUN npm ci --omit=dev

# FROM node:20-alpine
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# EXPOSE 3001
# CMD ["node", "src/index.js"]

FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src 
WORKDIR /app/src
EXPOSE 3001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]