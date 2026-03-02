FROM nginx:1.27-alpine

# Remove default nginx config and html
RUN rm /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy site folders (preserving external zip structure)
COPY _shared/ /usr/share/nginx/html/_shared/
COPY 1stopwings-site/ /usr/share/nginx/html/1stopwings-site/
COPY main-site/ /usr/share/nginx/html/main-site/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/1stopwings-site/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
