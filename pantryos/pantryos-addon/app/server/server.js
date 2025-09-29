'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const DATA_FILE = process.env.APP_DATA_FILE || path.join(__dirname, '../data/state.json');
const PUBLIC_DIR = process.env.APP_PUBLIC_DIR || path.join(__dirname, '../public');
const HOST = process.env.APP_HOST || '0.0.0.0';
const PORT = Number.parseInt(process.env.APP_PORT || '80', 10);
const BASE_PATH_RAW = process.env.APP_BASE_PATH || '/';
const BASE_PATH = BASE_PATH_RAW === '/' ? '' : BASE_PATH_RAW.replace(/\/$/, '');
const LOG_LEVEL = (process.env.APP_LOG_LEVEL || 'info').toLowerCase();

const CONFIG = {
    culture: process.env.APP_CULTURE || 'en',
    currency: process.env.APP_CURRENCY || 'USD',
    timezone: process.env.APP_TIMEZONE || 'UTC'
};

const EXTENSION_CONTENT_TYPES = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'application/javascript; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.mjs', 'application/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.ico', 'image/x-icon'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.webmanifest', 'application/manifest+json'],
]);

const LOG_LEVEL_ORDER = new Map([
    ['trace', 0],
    ['debug', 1],
    ['info', 2],
    ['notice', 3],
    ['warning', 4],
    ['error', 5],
    ['fatal', 6],
]);

const defaultState = {
    items: [],
    shoppingList: [],
    tasks: [],
};

let stateQueue = Promise.resolve();

function shouldLog(level) {
    const desired = LOG_LEVEL_ORDER.get(LOG_LEVEL) ?? LOG_LEVEL_ORDER.get('info');
    const current = LOG_LEVEL_ORDER.get(level) ?? LOG_LEVEL_ORDER.get('info');
    return current >= desired;
}

function log(level, message, metadata) {
    if (!shouldLog(level)) {
        return;
    }

    const prefix = `[pantryos:${level}]`;
    if (metadata) {
        console.log(prefix, message, metadata);
    } else {
        console.log(prefix, message);
    }
}

async function ensureDataDirectory() {
    try {
        await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true });
    } catch (err) {
        log('error', 'Failed to create data directory', err);
        throw err;
    }
}

async function readStateFromDisk() {
    try {
        const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        if (err.code === 'ENOENT') {
            log('warning', 'State file missing, creating a new one with defaults');
            await writeStateToDisk(defaultState);
            return { ...defaultState };
        }

        log('error', 'Unable to read state file', err);
        throw err;
    }
}

async function writeStateToDisk(state) {
    await ensureDataDirectory();
    const payload = `${JSON.stringify(state, null, 2)}\n`;
    await fs.promises.writeFile(DATA_FILE, payload, 'utf-8');
}

function queueStateOperation(operation) {
    const next = stateQueue.then(() => operation());
    stateQueue = next.catch((err) => {
        log('error', 'State operation failed', err);
    });
    return next;
}

function getState() {
    return queueStateOperation(() => readStateFromDisk());
}

function mutateState(mutator) {
    return queueStateOperation(async () => {
        const state = await readStateFromDisk();
        const result = await mutator(state);
        await writeStateToDisk(state);
        return result ?? state;
    });
}

function setSecurityHeaders(res) {
    const scriptSrc = "'self' https://unpkg.com";
    const styleSrc = "'self' 'unsafe-inline'";
    res.setHeader('Content-Security-Policy', [
        `default-src 'self'`,
        `script-src ${scriptSrc}`,
        `style-src ${styleSrc}`,
        `connect-src 'self'`,
        `img-src 'self' data:`,
        `font-src 'self'`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `frame-ancestors 'self'`,
        'upgrade-insecure-requests',
    ].join('; '));
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

function sendJson(res, status, payload) {
    const data = JSON.stringify(payload);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(data));
    res.end(data);
}

function sendError(res, status, message, details) {
    log('warning', `API error ${status}: ${message}`, details);
    sendJson(res, status, { error: message });
}

async function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1_048_576) {
                reject(new Error('Request body too large'));
                req.destroy();
            }
        });

        req.on('end', () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(err);
            }
        });

        req.on('error', (err) => reject(err));
    });
}

function sanitizeNumber(value, fallback = 0) {
    if (value === null || value === undefined) {
        return fallback;
    }

    const number = Number(value);
    if (Number.isNaN(number)) {
        return fallback;
    }

    return number;
}

function findAndUpdate(collection, id, updater) {
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) {
        return false;
    }

    const item = collection[index];
    const updated = updater(item);
    if (updated) {
        collection[index] = { ...item, ...updated };
    }

    return collection[index];
}

async function handleApi(req, res, pathname) {
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.end();
        return true;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (pathname === '/api/health' && req.method === 'GET') {
        sendJson(res, 200, { status: 'ok' });
        return true;
    }

    if (pathname === '/api/config' && req.method === 'GET') {
        sendJson(res, 200, { ...CONFIG });
        return true;
    }

    if (pathname === '/api/state' && req.method === 'GET') {
        const state = await getState();
        const summary = {
            items: state.items.length,
            shoppingList: state.shoppingList.length,
            openTasks: state.tasks.filter((task) => !task.completed).length,
        };
        sendJson(res, 200, { state, config: CONFIG, summary });
        return true;
    }

    if (pathname === '/api/items' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) {
                sendError(res, 400, 'Il nome del prodotto è obbligatorio');
                return true;
            }

            const quantity = sanitizeNumber(body.quantity, 1);
            const location = (body.location || '').trim();
            const bestBefore = (body.bestBefore || '').trim();

            const newItem = await mutateState((state) => {
                const item = {
                    id: crypto.randomUUID(),
                    name,
                    quantity: quantity > 0 ? quantity : 1,
                    location,
                    bestBefore: bestBefore || null,
                    createdAt: new Date().toISOString(),
                };
                state.items.push(item);
                return item;
            });

            sendJson(res, 201, newItem);
            return true;
        } catch (err) {
            log('error', 'Failed to add inventory item', err);
            sendError(res, 400, 'Impossibile elaborare il prodotto inviato', err.message);
            return true;
        }
    }

    if (pathname.startsWith('/api/items/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        try {
            const body = await parseJsonBody(req);
            const updatedItem = await mutateState((state) => {
                const updated = findAndUpdate(state.items, id, (item) => {
                    const changes = {};
                    if (body.name !== undefined) {
                        changes.name = String(body.name).trim() || item.name;
                    }
                    if (body.quantity !== undefined) {
                        const qty = sanitizeNumber(body.quantity, item.quantity);
                        changes.quantity = qty >= 0 ? qty : item.quantity;
                    }
                    if (body.location !== undefined) {
                        changes.location = String(body.location).trim();
                    }
                    if (body.bestBefore !== undefined) {
                        const value = String(body.bestBefore).trim();
                        changes.bestBefore = value || null;
                    }
                    return changes;
                });
                if (!updated) {
                    return null;
                }
                return updated;
            });

            if (!updatedItem) {
                sendError(res, 404, 'Prodotto non trovato');
                return true;
            }

            sendJson(res, 200, updatedItem);
            return true;
        } catch (err) {
            log('error', 'Failed to update inventory item', err);
            sendError(res, 400, 'Impossibile aggiornare il prodotto', err.message);
            return true;
        }
    }

    if (pathname.startsWith('/api/items/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = state.items.findIndex((item) => item.id === id);
            if (index === -1) {
                return false;
            }
            state.items.splice(index, 1);
            return true;
        });

        if (!removed) {
            sendError(res, 404, 'Prodotto non trovato');
            return true;
        }

        res.statusCode = 204;
        res.end();
        return true;
    }

    if (pathname === '/api/shopping-list' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) {
                sendError(res, 400, 'Il nome dell\'articolo è obbligatorio');
                return true;
            }
            const quantity = sanitizeNumber(body.quantity, 1);

            const entry = await mutateState((state) => {
                const item = {
                    id: crypto.randomUUID(),
                    name,
                    quantity: quantity > 0 ? quantity : 1,
                    completed: false,
                    createdAt: new Date().toISOString(),
                };
                state.shoppingList.push(item);
                return item;
            });

            sendJson(res, 201, entry);
            return true;
        } catch (err) {
            log('error', 'Failed to add shopping list entry', err);
            sendError(res, 400, 'Impossibile aggiungere l\'articolo alla lista', err.message);
            return true;
        }
    }

    if (pathname.startsWith('/api/shopping-list/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        try {
            const body = await parseJsonBody(req);
            const updatedItem = await mutateState((state) => {
                const updated = findAndUpdate(state.shoppingList, id, (item) => {
                    const changes = {};
                    if (body.name !== undefined) {
                        changes.name = String(body.name).trim() || item.name;
                    }
                    if (body.quantity !== undefined) {
                        const qty = sanitizeNumber(body.quantity, item.quantity);
                        changes.quantity = qty >= 0 ? qty : item.quantity;
                    }
                    if (body.completed !== undefined) {
                        changes.completed = Boolean(body.completed);
                    }
                    return changes;
                });
                return updated || null;
            });

            if (!updatedItem) {
                sendError(res, 404, 'Articolo della lista non trovato');
                return true;
            }

            sendJson(res, 200, updatedItem);
            return true;
        } catch (err) {
            log('error', 'Failed to update shopping list item', err);
            sendError(res, 400, 'Impossibile aggiornare l\'articolo della lista', err.message);
            return true;
        }
    }

    if (pathname.startsWith('/api/shopping-list/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = state.shoppingList.findIndex((item) => item.id === id);
            if (index === -1) {
                return false;
            }
            state.shoppingList.splice(index, 1);
            return true;
        });

        if (!removed) {
            sendError(res, 404, 'Articolo della lista non trovato');
            return true;
        }

        res.statusCode = 204;
        res.end();
        return true;
    }

    if (pathname === '/api/tasks' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) {
                sendError(res, 400, 'Il nome dell\'attività è obbligatorio');
                return true;
            }

            const task = await mutateState((state) => {
                const entry = {
                    id: crypto.randomUUID(),
                    name,
                    dueDate: (body.dueDate || '').trim() || null,
                    completed: Boolean(body.completed),
                    createdAt: new Date().toISOString(),
                };
                state.tasks.push(entry);
                return entry;
            });

            sendJson(res, 201, task);
            return true;
        } catch (err) {
            log('error', 'Failed to create task', err);
            sendError(res, 400, 'Impossibile aggiungere l\'attività', err.message);
            return true;
        }
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        try {
            const body = await parseJsonBody(req);
            const updatedTask = await mutateState((state) => {
                const updated = findAndUpdate(state.tasks, id, (task) => {
                    const changes = {};
                    if (body.name !== undefined) {
                        changes.name = String(body.name).trim() || task.name;
                    }
                    if (body.dueDate !== undefined) {
                        const due = String(body.dueDate).trim();
                        changes.dueDate = due || null;
                    }
                    if (body.completed !== undefined) {
                        changes.completed = Boolean(body.completed);
                        changes.completedAt = Boolean(body.completed) ? new Date().toISOString() : null;
                    }
                    return changes;
                });
                return updated || null;
            });

            if (!updatedTask) {
                sendError(res, 404, 'Attività non trovata');
                return true;
            }

            sendJson(res, 200, updatedTask);
            return true;
        } catch (err) {
            log('error', 'Failed to update task', err);
            sendError(res, 400, 'Impossibile aggiornare l\'attività', err.message);
            return true;
        }
    }

    if (pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = state.tasks.findIndex((task) => task.id === id);
            if (index === -1) {
                return false;
            }
            state.tasks.splice(index, 1);
            return true;
        });

        if (!removed) {
            sendError(res, 404, 'Attività non trovata');
            return true;
        }

        res.statusCode = 204;
        res.end();
        return true;
    }

    return false;
}

async function serveStaticFile(req, res, filePath) {
    try {
        const data = await fs.promises.readFile(filePath);
        const extension = path.extname(filePath);
        const contentType = EXTENSION_CONTENT_TYPES.get(extension) || 'application/octet-stream';
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', data.length);
        if (req.method === 'HEAD') {
            res.end();
        } else {
            res.end(data);
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.statusCode = 404;
            res.end('Not Found');
            return;
        }
        log('error', `Failed to serve static file ${filePath}`, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
}

function resolveStaticPath(requestPath) {
    let resolved = requestPath;
    if (resolved === '' || resolved === '/') {
        resolved = '/index.html';
    }

    resolved = path.normalize(resolved).replace(/^\.\/+/, '');
    return path.join(PUBLIC_DIR, resolved);
}

const server = http.createServer(async (req, res) => {
    setSecurityHeaders(res);

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;
    if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
        pathname = pathname.slice(BASE_PATH.length) || '/';
    }

    log('debug', 'Incoming request', { method: req.method, pathname });

    if (pathname.startsWith('/api/')) {
        const handled = await handleApi(req, res, pathname);
        if (!handled) {
            res.statusCode = 404;
            sendJson(res, 404, { error: 'Endpoint non trovato' });
        }
        return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
    }

    const filePath = resolveStaticPath(pathname);
    await serveStaticFile(req, res, filePath);
});

server.listen(PORT, HOST, () => {
    log('info', `PantryOS refactored server listening on http://${HOST}:${PORT}${BASE_PATH || ''}`);
});

server.on('clientError', (err, socket) => {
    log('warning', 'Client connection error', err.message);
    if (socket.writable) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
});
