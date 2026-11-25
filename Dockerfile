# Static Next.js export served by nginx (non-root, port 8080).
# Build: docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t salary-manager-frontend .
# Run:   docker run -p 8080:8080 salary-manager-frontend

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Inlined into the bundle at build time; next.config.ts rejects malformed values.
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
ARG NEXT_PUBLIC_API_URL=""
# Origin allowed in the CSP connect-src. Defaults to the build-time API URL; override at runtime if needed.
ENV API_ORIGIN=$NEXT_PUBLIC_API_URL
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
