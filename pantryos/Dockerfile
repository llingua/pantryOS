# ============ Build Stage ============
FROM node:18-alpine AS builder

WORKDIR /build

# Installa le dipendenze di build
COPY app/package*.json ./
RUN npm ci --only=production

# Copia il codice sorgente
COPY app/ ./

# ============ Runtime Stage ============
ARG BUILD_FROM
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Imposta le variabili d'ambiente
ENV \
    # Più tempo allo shutdown dei servizi
    S6_SERVICES_GRACETIME=30000 \
    # Percorso del file di stato
    APP_DATA_FILE=/data/pantryos/state.json \
    # Imposta NODE_ENV a production per prestazioni ottimali
    NODE_ENV=production \
    # Imposta utente non-root
    PUID=1000 \
    PGID=1000

# Crea utente e gruppo non-root
RUN \
    addgroup -g ${PGID} pantryos && \
    adduser -D -u ${PUID} -G pantryos -h /data -D pantryos && \
    mkdir -p /data/pantryos && \
    chown -R pantryos:pantryos /data/pantryos

# Crea le directory necessarie
RUN mkdir -p /usr/share/pantryos && \
    chown -R pantryos:pantryos /usr/share/pantryos

# Imposta la directory di lavoro
WORKDIR /opt/pantryos

# Copia gli script s6 e i file di servizio
COPY --chown=pantryos:pantryos rootfs/ /

# Copia il dataset seed in un path read-only
COPY --chown=pantryos:pantryos app/data/default-state.json /usr/share/pantryos/default-state.json

# Copia i file compilati dallo stage di build
COPY --from=builder --chown=pantryos:pantryos /build /opt/pantryos

# Imposta i permessi corretti
RUN chmod -R 755 /etc/services.d/pantryos && \
    chmod -R 755 /etc/cont-init.d

# Switch all'utente non-root
USER pantryos

# Esponi la porta (se necessario)
# EXPOSE 3000

# Etichette Docker
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

LABEL \
    io.hass.name="${BUILD_NAME}" \
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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando di avvio (gestito da s6)
