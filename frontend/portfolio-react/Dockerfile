# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm v9 (v10 blocks build scripts by default, breaking esbuild/react-scripts)
RUN npm install -g pnpm@9

# Copy workspace root config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for all workspace members (for dependency resolution)
COPY packages/cms-agent-panel/package.json packages/cms-agent-panel/
COPY frontend/portfolio-react/package.json frontend/portfolio-react/

# Install all workspace dependencies from root
RUN pnpm install --frozen-lockfile

# Copy the cms-agent-panel source and build it first
COPY packages/cms-agent-panel/ packages/cms-agent-panel/
RUN pnpm --filter @fvargas/cms-agent-panel build

# Copy portfolio-react source
COPY frontend/portfolio-react/ frontend/portfolio-react/

# Build the app (disable ESLint in production build - linting should happen in CI)
ENV DISABLE_ESLINT_PLUGIN=true
RUN pnpm --filter tonu-react build

# Runtime stage - serve with nginx
FROM nginx:alpine AS runtime

# Copy built files
COPY --from=build /app/frontend/portfolio-react/build /usr/share/nginx/html

# Copy nginx config
COPY frontend/portfolio-react/nginx.conf /etc/nginx/conf.d/default.conf

# Copy production config.json (will be overwritten by docker-compose if needed)
COPY frontend/portfolio-react/docker-config.json /usr/share/nginx/html/config.json

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
