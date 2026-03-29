# Build stage — workspace-aware build that includes @fvargas/cms-agent-panel
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm v9 (v10 blocks build scripts by default, breaking esbuild)
RUN npm install -g pnpm@9

# Copy workspace root config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for all workspace members (for dependency resolution)
COPY packages/cms-agent-panel/package.json packages/cms-agent-panel/
COPY frontend/portfolio-jessica/package.json frontend/portfolio-jessica/

# Install all workspace dependencies from root
RUN pnpm install --frozen-lockfile

# Copy the cms-agent-panel source and build it first
COPY packages/cms-agent-panel/ packages/cms-agent-panel/
RUN pnpm --filter @fvargas/cms-agent-panel build

# Copy portfolio-jessica source
COPY frontend/portfolio-jessica/ frontend/portfolio-jessica/

# Build the app
RUN pnpm --filter portfolio-jessica build

# Runtime stage - serve with nginx
FROM nginx:alpine AS runtime

# Copy built files (Vite outputs to 'dist' directory)
COPY --from=build /app/frontend/portfolio-jessica/dist /usr/share/nginx/html

# Create nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location = /admin { \
        try_files /admin.html =404; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
