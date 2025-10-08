#!/bin/bash

# Exit on error
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# Configuration
VERSION=$(grep '^version:' pantryos/config.yaml | awk '{print $2}' | tr -d '"')
ADDON_NAME="pantryos"
TEMP_DIR="/tmp/${ADDON_NAME}-build-$(date +%s)"
OUTPUT_DIR="${SCRIPT_DIR}/dist"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf "${TEMP_DIR}" "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}" "${TEMP_DIR}"

# Copy necessary files
echo "Copying files..."
cp -r pantryos/ "${TEMP_DIR}/"

# Remove unnecessary files
echo "Cleaning up..."
find "${TEMP_DIR}" -type f -name ".DS_Store" -delete
find "${TEMP_DIR}" -type d -name ".git" -exec rm -rf {} + 2>/dev/null || true
find "${TEMP_DIR}" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

# Create the archive
echo "Creating archive..."
cd "${TEMP_DIR}"
tar -czf "${OUTPUT_DIR}/${ADDON_NAME}-${VERSION}.tar.gz" --exclude='.git*' --exclude='.DS_Store' --exclude='node_modules' *

# Generate checksum
echo "Generating checksum..."
cd "${OUTPUT_DIR}"
shasum -a 256 "${ADDON_NAME}-${VERSION}.tar.gz" > "${ADDON_NAME}-${VERSION}.tar.gz.sha256"

# Sign the archive (requires GPG)
if command -v gpg &> /dev/null; then
    echo "Signing archive..."
    gpg --detach-sign -a "${ADDON_NAME}-${VERSION}.tar.gz" 2>/dev/null || echo "Warning: GPG signing failed (install GPG or ignore if not needed)"
fi

# Clean up
rm -rf "${TEMP_DIR}"

# Verify the archive
echo -e "\nVerifying archive..."
tar -tzf "${OUTPUT_DIR}/${ADDON_NAME}-${VERSION}.tar.gz" >/dev/null && \
    echo "✅ Archive verification successful" || \
    echo "❌ Archive verification failed"

# Show results
echo -e "\nBuild completed!"
echo "📦 Archive: ${OUTPUT_DIR}/${ADDON_NAME}-${VERSION}.tar.gz"
echo "🔒 Checksum: ${OUTPUT_DIR}/${ADDON_NAME}-${VERSION}.tar.gz.sha256"

# Instructions for creating a release
echo -e "\nTo create a new release:"
echo "1. Create a new tag:"
echo "   git tag -a v${VERSION} -m 'Release ${VERSION}'"
echo "   git push origin v${VERSION}"
echo -e "\n2. Create a new release on GitHub and upload:"
echo "   - dist/${ADDON_NAME}-${VERSION}.tar.gz"
echo "   - dist/${ADDON_NAME}-${VERSION}.tar.gz.sha256"
echo "   - dist/${ADDON_NAME}-${VERSION}.tar.gz.asc (if signed)"

# Show next steps
echo -e "\nNext steps:"
echo "1. Add the repository to Home Assistant:"
echo "   - Go to Settings > Add-ons"
echo "   - Click on the three dots in the top right"
echo "   - Select 'Add-on store'"
echo "   - Click the three dots in the top right"
echo "   - Select 'Repositories'"
echo "   - Add: https://github.com/llingua/pantryos"
echo -e "\n2. Install PantryOS from the add-on store!"
