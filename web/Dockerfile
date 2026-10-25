FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .

RUN npm run build

FROM nginx:stable-alpine

COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN apk add --no-cache jq \
  && sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh \
  && chmod +x /docker-entrypoint.d/40-runtime-config.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
