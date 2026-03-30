FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

EXPOSE 3100

CMD ["node", "src/index.js"]
