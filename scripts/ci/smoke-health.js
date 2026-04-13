'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const appDir = path.join(rootDir, 'pantryos/app');
const tempDir = path.join(rootDir, '.tmp/ci');
const port = Number(process.env.CI_APP_PORT || 3210);

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestHealth() {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk.toString();
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body });
            });
        });

        req.on('error', reject);
        req.setTimeout(1500, () => {
            req.destroy(new Error('Health request timed out'));
        });
    });
}

async function waitForHealth(retries = 20) {
    for (let attempt = 0; attempt < retries; attempt += 1) {
        try {
            const response = await requestHealth();
            if (response.statusCode === 200) {
                return response;
            }
        } catch (error) {
            if (attempt === retries - 1) {
                throw error;
            }
        }

        await delay(500);
    }

    throw new Error('Server did not become healthy in time');
}

async function main() {
    fs.mkdirSync(tempDir, { recursive: true });

    const env = {
        ...process.env,
        NODE_ENV: 'test',
        APP_HOST: '127.0.0.1',
        APP_PORT: String(port),
        APP_DATA_FILE: path.join(tempDir, 'state.json'),
        APP_CONFIG_FILE: path.join(tempDir, 'config.json'),
        APP_SCHEMA_FILE: path.join(appDir, 'data/schema.json'),
        APP_PUBLIC_DIR: path.join(appDir, 'public'),
        APP_BASE_PATH: '/',
        APP_LOG_LEVEL: 'error',
    };

    const server = spawn('node', ['server/pantryos-server.js'], {
        cwd: appDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    server.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
    });

    try {
        const response = await waitForHealth();
        const payload = JSON.parse(response.body);
        if (payload.status !== 'ok') {
            throw new Error(`Unexpected health payload: ${response.body}`);
        }
        console.log('Health smoke test passed');
    } finally {
        server.kill('SIGTERM');
        await delay(250);
        if (!server.killed) {
            server.kill('SIGKILL');
        }
    }

    if (server.exitCode && server.exitCode !== 0) {
        throw new Error(stderr || `Server exited with code ${server.exitCode}`);
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
