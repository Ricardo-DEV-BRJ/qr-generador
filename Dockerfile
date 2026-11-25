# syntax=docker/dockerfile:1

# ============ 1) Build: compila la app con Node ============
FROM node:22-alpine AS build
WORKDIR /app

# Primero solo los manifiestos: Docker cachea las dependencias si no cambian.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ============ 2) Runtime: Nginx liviano con soporte brotli ============
FROM alpine:3.22

RUN apk add --no-cache nginx nginx-mod-http-brotli \
    && mkdir -p /run/nginx /etc/nginx/snippets \
    && rm -f /etc/nginx/http.d/default.conf

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/http.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1

STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
