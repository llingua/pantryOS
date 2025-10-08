# syntax=docker/dockerfile:1

# Deve essere PRIMA di qualsiasi FROM, così è visibile nella FROM runtime
ARG BUILD_FROM

# ============ Build stage (opzionale: se hai un'app Node in /app) ============
FROM node:18-alpine AS builder
WORKDIR /build

# Copia i sorgenti dell'app (se la cartella esiste)
COPY app/ ./

# Installa solo dipendenze runtime se c'è package.json
RUN if [ -f package.json ]; then \
      if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
        npm ci --omit=dev; \
      else \
        npm install --omit=dev; \
      fi; \
    else \
      echo "No package.json found, skipping npm install"; \
    fi
# Se hai uno step di build (frontend), sblocca:
# RUN npm run build || true

# ============ Runtime stage (base Home Assistant) ============
FROM $BUILD_FROM

# Variabili d'ambiente utili
ENV S6_SERVICES_GRACETIME=30000 \
    APP_DATA_FILE=/data/pantryos/state.json \
    NODE_ENV=production \
    PUID=1000 \
    PGID=1000

# Crea utente/gruppo non-root e directory dati (idempotente)
RUN (grep -q '^pantryos:' /etc/group || addgroup -g ${PGID} pantryos || addgroup pantryos) \
 && (id -u pantryos >/dev/null 2>&1 || adduser -D -u ${PUID} -G pantryos -h /data pantryos || adduser -D -G pantryos -h /data pantryos) \
 && mkdir -p /data/pantryos /usr/share/pantryos /opt/pantryos

WORKDIR /opt/pantryos

# Copia s6, script di servizio e asset statici di sistema
# (Metti qui anche: rootfs/usr/share/pantryos/default-state.json)
COPY rootfs/ /

# Assicura i permessi corretti
RUN chown -R pantryos:pantryos /data/pantryos /usr/share/pantryos /opt/pantryos \
 && [ -d /etc/services.d/pantryos ] && chmod -R 755 /etc/services.d/pantryos || true \
 && [ -d /etc/cont-init.d ] && chmod -R 755 /etc/cont-init.d || true

# (Opzionale) Copia artefatti dallo stage builder
# - Se hai un "dist", preferisci solo quello:
# COPY --from=builder --chown=pantryos:pantryos /build/dist /opt/pantryos/app
# - Altrimenti copia tutto /build (come stavi facendo):
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

# Healthcheck (usa wget; fallback a curl se presente)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/health || curl -fsS http://127.0.0.1:3000/health || exit 1

# Nessun CMD: lo start è gestito da s6 (script in /etc/services.d/pantryos/run)

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando di avvio (gestito da s6)
