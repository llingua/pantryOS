# ============ Base immagine HA add-on ============
ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.5
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# (opzionale) più tempo allo shutdown dei servizi
ENV S6_SERVICES_GRACETIME=30000

# L'app vivrà qui
WORKDIR /opt/pantryos

# Copy script s6 e file di servizio
COPY rootfs/ /

# Copy codice/app (backend Node + frontend statico) nel container
COPY app/ ./

# Copy il dataset seed in un path read-only dell'immagine
COPY data/default-state.json /usr/share/pantryos/default-state.json

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_DESCRIPTION
ARG BUILD_NAME
ARG BUILD_REF
ARG BUILD_REPOSITORY
ARG BUILD_VERSION

# Labels
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
