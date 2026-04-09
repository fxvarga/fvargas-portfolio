FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ──── Runtime ────
FROM nginx:1.27-alpine

# SPA-friendly nginx config with API reverse proxy
# The API_UPSTREAM default assumes docker-compose service name "tinytoes-api"
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  resolver 127.0.0.11 valid=30s; \
  \
  location /api/ { \
    proxy_pass http://tinytoes-api:8080; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
  } \
  \
  location /healthz { \
    proxy_pass http://tinytoes-api:8080; \
    proxy_set_header Host $host; \
  } \
  \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
  \
  location /assets/ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
  } \
  \
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ { \
    expires 30d; \
    add_header Cache-Control "public"; \
  } \
  \
  location = /sw.js { \
    expires off; \
    add_header Cache-Control "no-store, no-cache, must-revalidate"; \
  } \
  \
  location = /manifest.webmanifest { \
    expires 1d; \
    add_header Content-Type "application/manifest+json"; \
  } \
}' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
