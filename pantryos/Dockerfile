# syntax=docker/dockerfile:1

# Deve essere PRIMA di qualsiasi FROM, così è visibile nella FROM runtime
ARG BUILD_FROM

FROM node:18-alpine AS builder
WORKDIR /build

COPY app/ ./

RUN if [ -f package.json ]; then \
      if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
        npm ci --omit=dev; \
      else \
        npm install --omit=dev; \
      fi; \
    else \
      echo "No package.json found, skipping npm install"; \
    fi
FROM $BUILD_FROM

ENV S6_SERVICES_GRACETIME=30000 \
    APP_DATA_FILE=/data/pantryos/state.json \
    APP_CONFIG_FILE=/data/pantryos/config.json \
    APP_SCHEMA_FILE=/opt/pantryos/data/schema.json \
    APP_PUBLIC_DIR=/opt/pantryos/public \
    APP_BASE_PATH=/ \
    NODE_ENV=production \
    PUID=1000 \
    PGID=1000

# Crea utente/gruppo non-root e directory dati (idempotente)
RUN (grep -q '^pantryos:' /etc/group || addgroup -g ${PGID} pantryos || addgroup pantryos) \
 && (id -u pantryos >/dev/null 2>&1 || adduser -D -u ${PUID} -G pantryos -h /data pantryos || adduser -D -G pantryos -h /data pantryos) \
 && mkdir -p /data/pantryos /usr/share/pantryos /opt/pantryos

WORKDIR /opt/pantryos

COPY rootfs/ /

RUN chown -R pantryos:pantryos /data/pantryos /usr/share/pantryos /opt/pantryos \
 && [ -d /etc/services.d/pantryos ] && chmod -R 755 /etc/services.d/pantryos || true \
 && [ -d /etc/cont-init.d ] && chmod -R 755 /etc/cont-init.d || true

COPY --from=builder --chown=pantryos:pantryos /build /opt/pantryos

# Etichette (il Supervisor le inietta come build args)
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

LABEL io.hass.name="${BUILD_NAME}" \
      io.hass.description="${BUILD_DESCRIPTION}" \
      io.hass.arch="${BUILD_ARCH}" \
      io.hass.type="addon" \
      io.hass.version=${BUILD_VERSION} \
      maintainer="PantryOS Project" \
      org.opencontainers.image.title="${BUILD_NAME}" \
      org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
      org.opencontainers.image.vendor="PantryOS" \
      org.opencontainers.image.authors="PantryOS Team" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.url="https://pantryos.app" \
      org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
      org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" \
      org.opencontainers.image.created=${BUILD_DATE} \
      org.opencontainers.image.revision=${BUILD_REF} \
      org.opencontainers.image.version=${BUILD_VERSION}

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8099/api/health || curl -fsS http://127.0.0.1:8099/api/health || exit 1
