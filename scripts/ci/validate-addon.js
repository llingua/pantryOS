'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const addonDir = path.join(rootDir, 'pantryos');

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function readText(relativePath) {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function main() {
    const requiredPaths = [
        'README.md',
        'pantryos/config.yaml',
        'pantryos/build.yaml',
        'pantryos/Dockerfile',
        'pantryos/rootfs/etc/services.d/pantryos/run',
        'pantryos/app/server/pantryos-server.js',
        'pantryos/app/public/index.html',
        'pantryos/app/data/default-state.json',
        'pantryos/app/data/schema.json',
    ];

    for (const relativePath of requiredPaths) {
        assert(fs.existsSync(path.join(rootDir, relativePath)), `Missing required file: ${relativePath}`);
    }

    const configYaml = readText('pantryos/config.yaml');
    assert(/slug:\s*pantryos/.test(configYaml), 'config.yaml must declare slug pantryos');
    assert(/ingress:\s*true/.test(configYaml), 'config.yaml must enable ingress');
    assert(/ingress_port:\s*8099/.test(configYaml), 'config.yaml must expose ingress port 8099');

    const dockerfile = readText('pantryos/Dockerfile');
    assert(dockerfile.includes('APP_DATA_FILE=/data/pantryos/state.json'), 'Dockerfile must configure APP_DATA_FILE');
    assert(dockerfile.includes('http://127.0.0.1:8099/api/health'), 'Dockerfile healthcheck must target /api/health on port 8099');

    const runScript = readText('pantryos/rootfs/etc/services.d/pantryos/run');
    assert(runScript.includes('node server/pantryos-server.js'), 's6 run script must start pantryos-server.js');
    assert(runScript.includes('APP_PORT'), 's6 run script must define APP_PORT');

    const packageJson = JSON.parse(readText('package.json'));
    assert(packageJson.scripts && packageJson.scripts.dev, 'package.json must expose a dev script');
    assert(packageJson.scripts['addon:build'], 'package.json must expose addon:build');

    const addonPackageJson = JSON.parse(readText('pantryos/app/package.json'));
    assert(addonPackageJson.main === 'server/pantryos-server.js', 'addon app package must point to pantryos-server.js');

    console.log('Addon structure validation passed');
}

try {
    main();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
