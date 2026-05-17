# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm v9
RUN npm install -g pnpm@9

# Copy workspace root config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json for portfolio-pinchos
COPY frontend/portfolio-pinchos/package.json frontend/portfolio-pinchos/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY frontend/portfolio-pinchos/ frontend/portfolio-pinchos/

# Build the app
RUN pnpm --filter portfolio-pinchos build

# Runtime stage - serve with nginx
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config and html
RUN rm /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config
COPY frontend/portfolio-pinchos/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/frontend/portfolio-pinchos/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
