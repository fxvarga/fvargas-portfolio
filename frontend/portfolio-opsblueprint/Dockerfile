# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install dependencies (no lockfile yet, will be generated)
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Runtime stage - serve with nginx
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config and html
RUN rm /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
