# Custom Caddy image with the GoDaddy DNS plugin baked in.
# Required because the Twingate-only voice subdomain (voice.fernando-vargas.com)
# resolves to a private IP, so Let's Encrypt HTTP-01 can't reach port 80 and we
# must use DNS-01. The official caddy:2-alpine image does not ship DNS plugins.
FROM caddy:2-builder-alpine AS builder
RUN xcaddy build --with github.com/caddy-dns/godaddy

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
