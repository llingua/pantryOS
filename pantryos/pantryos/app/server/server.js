'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const DATA_FILE = process.env.APP_DATA_FILE || path.join(__dirname, '../data/state.json');
const PUBLIC_DIR = process.env.APP_PUBLIC_DIR || path.join(__dirname, '../public');
const HOST = process.env.APP_HOST || '0.0.0.0';
const PORT = Number.parseInt(process.env.APP_PORT || '8080', 10);
const BASE_PATH_RAW = process.env.APP_BASE_PATH || '/';
const BASE_PATH = BASE_PATH_RAW === '/' ? '' : BASE_PATH_RAW.replace(/\/$/, '');
const LOG_LEVEL = (process.env.APP_LOG_LEVEL || 'info').toLowerCase();
const CONFIG_FILE = process.env.APP_CONFIG_FILE || path.join(__dirname, '../data/config.json');

let CONFIG = {
    culture: process.env.APP_CULTURE || 'en',
    currency: process.env.APP_CURRENCY || 'USD',
    timezone: process.env.APP_TIMEZONE || 'UTC',
    logLevel: LOG_LEVEL
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
// Config load/save
async function loadConfig() {
    const defaults = {
        culture: process.env.APP_CULTURE || 'en',
        currency: process.env.APP_CURRENCY || 'USD',
        timezone: process.env.APP_TIMEZONE || 'UTC',
        logLevel: LOG_LEVEL
    };

    try {
        const raw = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
        const fileConfig = JSON.parse(raw);
        CONFIG = { ...defaults, ...fileConfig };
        log('info', 'Config file loaded');
    } catch (err) {
        if (err.code === 'ENOENT') {
            await writeConfig(defaults);
            CONFIG = { ...defaults };
            log('notice', 'Config file not found, created with defaults');
        } else {
            log('warning', 'Unable to read config file, using defaults', err.message);
            CONFIG = { ...defaults };
        }
    }
}

async function writeConfig(config) {
    const safe = {
        culture: String(config.culture || 'en').trim() || 'en',
        currency: String(config.currency || 'USD').trim() || 'USD',
        timezone: String(config.timezone || 'UTC').trim() || 'UTC',
        logLevel: String(config.logLevel || LOG_LEVEL).toLowerCase()
    };
    await fs.promises.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
    await fs.promises.writeFile(CONFIG_FILE, `${JSON.stringify(safe, null, 2)}\n`, 'utf-8');
    CONFIG = safe;
}


const defaultState = {
    items: [],
    shoppingList: [],
    tasks: [],
    locations: [],
    productGroups: [],
    quantityUnits: [],
    shoppingLocations: [],
    products: [],
    barcodes: [],
    chores: []
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
        const state = JSON.parse(raw);

        // Verifica che lo stato abbia la struttura corretta
        if (!state || typeof state !== 'object') {
            throw new Error('Invalid state structure');
        }

        // Assicurati che tutte le proprietà necessarie esistano
        const validState = {
            items: state.items || [],
            shoppingList: state.shoppingList || [],
            tasks: state.tasks || [],
            locations: state.locations || [],
            productGroups: state.productGroups || [],
            quantityUnits: state.quantityUnits || [],
            shoppingLocations: state.shoppingLocations || [],
            products: state.products || [],
            barcodes: state.barcodes || [],
            chores: state.chores || []
        };

        return validState;
    } catch (err) {
        if (err.code === 'ENOENT') {
            log('warning', 'State file missing, creating a new one with defaults');
            await writeStateToDisk(defaultState);
            return { ...defaultState };
        }

        log('warning', 'State file corrupted or invalid, recreating with defaults', err.message);
        await writeStateToDisk(defaultState);
        return { ...defaultState };
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
    const scriptSrc = "'self' https://unpkg.com https://static.cloudflareinsights.com";
    const styleSrc = "'self' 'unsafe-inline' https://cdn.jsdelivr.net";
    const fontSrc = "'self' https://cdn.jsdelivr.net";
    res.setHeader('Content-Security-Policy', [
        `default-src 'self'`,
        `script-src ${scriptSrc}`,
        `style-src ${styleSrc}`,
        `connect-src 'self' https://world.openfoodfacts.org https://world.openbeautyfacts.org https://world.openproductfacts.org`,
        `img-src 'self' data:`,
        `font-src ${fontSrc}`,
        `media-src 'self'`,
        `worker-src 'self' blob:`,
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
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=(self)');
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

    if (pathname === '/api/config' && (req.method === 'PATCH' || req.method === 'PUT')) {
        try {
            const body = await parseJsonBody(req);
            const next = {
                culture: body.culture !== undefined ? String(body.culture).trim() : CONFIG.culture,
                currency: body.currency !== undefined ? String(body.currency).trim() : CONFIG.currency,
                timezone: body.timezone !== undefined ? String(body.timezone).trim() : CONFIG.timezone,
                logLevel: body.logLevel !== undefined ? String(body.logLevel).toLowerCase().trim() : CONFIG.logLevel,
            };

            if (!next.culture) {
                return sendError(res, 400, 'Parametro "culture" non valido');
            }
            if (!next.currency) {
                return sendError(res, 400, 'Parametro "currency" non valido');
            }
            if (!next.timezone) {
                return sendError(res, 400, 'Parametro "timezone" non valido');
            }

            await writeConfig(next);
            sendJson(res, 200, { ...CONFIG });
            return true;
        } catch (err) {
            log('error', 'Failed to update config', err);
            sendError(res, 400, 'Impossibile aggiornare la configurazione', err.message);
            return true;
        }
    }

    if (pathname === '/api/state' && req.method === 'GET') {
        const state = await getState();
        const summary = {
            items: (state.items || []).length,
            shoppingList: (state.shoppingList || []).length
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

    // Minimal entity endpoints to support Manage Data UI
    if (pathname === '/api/locations' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.locations || []);
        return true;
    }
    if (pathname === '/api/locations' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) return sendError(res, 400, 'Il nome della location è obbligatorio');
            const location = await mutateState((state) => {
                const l = { id: crypto.randomUUID(), name, description: (body.description || '').trim(), isFreezer: Boolean(body.isFreezer), createdAt: new Date().toISOString() };
                state.locations = state.locations || [];
                state.locations.push(l);
                return l;
            });
            sendJson(res, 201, location);
            return true;
        } catch (err) {
            return sendError(res, 400, 'Impossibile aggiungere la location', err.message);
        }
    }
    if (pathname.startsWith('/api/locations/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        const body = await parseJsonBody(req);
        const updated = await mutateState((state) => findAndUpdate(state.locations, id, (loc) => {
            const changes = {};
            if (body.name !== undefined) changes.name = String(body.name).trim() || loc.name;
            if (body.description !== undefined) changes.description = String(body.description).trim();
            if (body.isFreezer !== undefined) changes.isFreezer = Boolean(body.isFreezer);
            return changes;
        }));
        if (!updated) return sendError(res, 404, 'Location non trovata');
        sendJson(res, 200, updated);
        return true;
    }
    if (pathname.startsWith('/api/locations/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = (state.locations || []).findIndex((l) => l.id === id);
            if (index === -1) return false;
            state.locations.splice(index, 1);
            return true;
        });
        if (!removed) return sendError(res, 404, 'Location non trovata');
        res.statusCode = 204; res.end(); return true;
    }

    if (pathname === '/api/product-groups' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.productGroups || []);
        return true;
    }
    if (pathname === '/api/product-groups' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const name = (body.name || '').trim();
        if (!name) return sendError(res, 400, 'Il nome del gruppo è obbligatorio');
        const group = await mutateState((state) => {
            const g = { id: crypto.randomUUID(), name, description: (body.description || '').trim(), createdAt: new Date().toISOString() };
            state.productGroups = state.productGroups || [];
            state.productGroups.push(g);
            return g;
        });
        sendJson(res, 201, group); return true;
    }
    if (pathname.startsWith('/api/product-groups/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        const body = await parseJsonBody(req);
        const updated = await mutateState((state) => findAndUpdate(state.productGroups, id, (g) => {
            const changes = {};
            if (body.name !== undefined) changes.name = String(body.name).trim() || g.name;
            if (body.description !== undefined) changes.description = String(body.description).trim();
            return changes;
        }));
        if (!updated) return sendError(res, 404, 'Gruppo non trovato');
        sendJson(res, 200, updated); return true;
    }
    if (pathname.startsWith('/api/product-groups/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = (state.productGroups || []).findIndex((g) => g.id === id);
            if (index === -1) return false;
            state.productGroups.splice(index, 1);
            return true;
        });
        if (!removed) return sendError(res, 404, 'Gruppo non trovato');
        res.statusCode = 204; res.end(); return true;
    }

    if (pathname === '/api/quantity-units' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.quantityUnits || []); return true;
    }
    if (pathname === '/api/quantity-units' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const name = (body.name || '').trim();
        if (!name) return sendError(res, 400, 'Il nome dell\'unità è obbligatorio');
        const unit = await mutateState((state) => {
            const u = { id: crypto.randomUUID(), name, namePlural: body.namePlural || name, description: (body.description || '').trim(), isInteger: Boolean(body.isInteger), createdAt: new Date().toISOString() };
            state.quantityUnits = state.quantityUnits || [];
            state.quantityUnits.push(u);
            return u;
        });
        sendJson(res, 201, unit); return true;
    }
    if (pathname.startsWith('/api/quantity-units/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        const body = await parseJsonBody(req);
        const updated = await mutateState((state) => findAndUpdate(state.quantityUnits, id, (u) => {
            const changes = {};
            if (body.name !== undefined) changes.name = String(body.name).trim() || u.name;
            if (body.namePlural !== undefined) changes.namePlural = String(body.namePlural).trim() || u.namePlural;
            if (body.description !== undefined) changes.description = String(body.description).trim();
            if (body.isInteger !== undefined) changes.isInteger = Boolean(body.isInteger);
            return changes;
        }));
        if (!updated) return sendError(res, 404, 'Unità non trovata');
        sendJson(res, 200, updated); return true;
    }
    if (pathname.startsWith('/api/quantity-units/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = (state.quantityUnits || []).findIndex((u) => u.id === id);
            if (index === -1) return false;
            state.quantityUnits.splice(index, 1);
            return true;
        });
        if (!removed) return sendError(res, 404, 'Unità non trovata');
        res.statusCode = 204; res.end(); return true;
    }

    if (pathname === '/api/shopping-locations' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.shoppingLocations || []); return true;
    }
    if (pathname === '/api/shopping-locations' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const name = (body.name || '').trim();
        if (!name) return sendError(res, 400, 'Il nome del negozio è obbligatorio');
        const shop = await mutateState((state) => {
            const s = { id: crypto.randomUUID(), name, description: (body.description || '').trim(), createdAt: new Date().toISOString() };
            state.shoppingLocations = state.shoppingLocations || [];
            state.shoppingLocations.push(s);
            return s;
        });
        sendJson(res, 201, shop); return true;
    }
    if (pathname.startsWith('/api/shopping-locations/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        const body = await parseJsonBody(req);
        const updated = await mutateState((state) => findAndUpdate(state.shoppingLocations, id, (s) => {
            const changes = {};
            if (body.name !== undefined) changes.name = String(body.name).trim() || s.name;
            if (body.description !== undefined) changes.description = String(body.description).trim();
            return changes;
        }));
        if (!updated) return sendError(res, 404, 'Negozio non trovato');
        sendJson(res, 200, updated); return true;
    }
    if (pathname.startsWith('/api/shopping-locations/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = (state.shoppingLocations || []).findIndex((s) => s.id === id);
            if (index === -1) return false;
            state.shoppingLocations.splice(index, 1);
            return true;
        });
        if (!removed) return sendError(res, 404, 'Negozio non trovato');
        res.statusCode = 204; res.end(); return true;
    }

    if (pathname === '/api/products' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.products || []); return true;
    }
    if (pathname === '/api/products' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const name = (body.name || '').trim();
        if (!name) return sendError(res, 400, 'Il nome del prodotto è obbligatorio');

        const result = await mutateState((state) => {
            // Cerca se il prodotto esiste già (per nome)
            let existingProduct = state.products?.find(p => p.name.toLowerCase() === name.toLowerCase());
            let product;

            if (existingProduct) {
                // Aggiorna il prodotto esistente
                product = { ...existingProduct };
                if (body.barcode !== undefined) product.barcode = body.barcode ? String(body.barcode).trim() : null;
                if (body.imageUrl !== undefined) product.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
                if (body.imageSmallUrl !== undefined) product.imageSmallUrl = body.imageSmallUrl ? String(body.imageSmallUrl).trim() : null;
                if (body.brand !== undefined) product.brand = body.brand ? String(body.brand).trim() : null;
                if (body.categories !== undefined) product.categories = body.categories ? String(body.categories).trim() : null;
                if (body.ingredients !== undefined) product.ingredients = body.ingredients ? String(body.ingredients).trim() : null;
                if (body.allergens !== undefined) product.allergens = body.allergens ? String(body.allergens).trim() : null;
                if (body.nutritionGrade !== undefined) product.nutritionGrade = body.nutritionGrade ? String(body.nutritionGrade).trim() : null;
                if (body.energy !== undefined) product.energy = body.energy ? String(body.energy).trim() : null;
                if (body.energyUnit !== undefined) product.energyUnit = body.energyUnit ? String(body.energyUnit).trim() : null;
                if (body.quantity !== undefined) product.quantity = body.quantity ? String(body.quantity).trim() : null;
                if (body.countries !== undefined) product.countries = body.countries ? String(body.countries).trim() : null;
                if (body.labels !== undefined) product.labels = body.labels ? String(body.labels).trim() : null;
                if (body.packaging !== undefined) product.packaging = body.packaging ? String(body.packaging).trim() : null;
                if (body.ecoscore !== undefined) product.ecoscore = body.ecoscore ? String(body.ecoscore).trim() : null;
                if (body.novaGroup !== undefined) product.novaGroup = body.novaGroup ? String(body.novaGroup).trim() : null;
                if (body.openFactsUrl !== undefined) product.openFactsUrl = body.openFactsUrl ? String(body.openFactsUrl).trim() : null;
                if (body.openFactsSource !== undefined) product.openFactsSource = body.openFactsSource ? String(body.openFactsSource).trim() : null;
                if (body.openFactsLanguage !== undefined) product.openFactsLanguage = body.openFactsLanguage ? String(body.openFactsLanguage).trim() : null;
                if (body.description !== undefined) product.description = (body.description || '').trim();
                if (body.productGroupId !== undefined) product.productGroupId = body.productGroupId || null;
                if (body.quantityUnitId !== undefined) product.quantityUnitId = body.quantityUnitId || null;
                if (body.shoppingLocationId !== undefined) product.shoppingLocationId = body.shoppingLocationId || null;
                if (body.minStockAmount !== undefined) product.minStockAmount = sanitizeNumber(body.minStockAmount, product.minStockAmount);

                // Aggiorna il prodotto nell'array
                const index = state.products.findIndex(p => p.id === existingProduct.id);
                if (index !== -1) {
                    state.products[index] = product;
                }
            } else {
                // Crea un nuovo prodotto
                product = {
                    id: crypto.randomUUID(),
                    name,
                    barcode: body.barcode ? String(body.barcode || '').trim() : null,
                    imageUrl: body.imageUrl ? String(body.imageUrl || '').trim() : null,
                    imageSmallUrl: body.imageSmallUrl ? String(body.imageSmallUrl || '').trim() : null,
                    brand: body.brand ? String(body.brand || '').trim() : null,
                    categories: body.categories ? String(body.categories || '').trim() : null,
                    ingredients: body.ingredients ? String(body.ingredients || '').trim() : null,
                    allergens: body.allergens ? String(body.allergens || '').trim() : null,
                    nutritionGrade: body.nutritionGrade ? String(body.nutritionGrade || '').trim() : null,
                    energy: body.energy ? String(body.energy || '').trim() : null,
                    energyUnit: body.energyUnit ? String(body.energyUnit || '').trim() : null,
                    quantity: body.quantity ? String(body.quantity || '').trim() : null,
                    countries: body.countries ? String(body.countries || '').trim() : null,
                    labels: body.labels ? String(body.labels || '').trim() : null,
                    packaging: body.packaging ? String(body.packaging || '').trim() : null,
                    ecoscore: body.ecoscore ? String(body.ecoscore || '').trim() : null,
                    novaGroup: body.novaGroup ? String(body.novaGroup || '').trim() : null,
                    openFactsUrl: body.openFactsUrl ? String(body.openFactsUrl || '').trim() : null,
                    openFactsSource: body.openFactsSource ? String(body.openFactsSource || '').trim() : null,
                    openFactsLanguage: body.openFactsLanguage ? String(body.openFactsLanguage || '').trim() : null,
                    description: (body.description || '').trim(),
                    productGroupId: body.productGroupId || null,
                    quantityUnitId: body.quantityUnitId || null,
                    shoppingLocationId: body.shoppingLocationId || null,
                    minStockAmount: sanitizeNumber(body.minStockAmount, 0),
                    createdAt: new Date().toISOString()
                };
                state.products = state.products || [];
                state.products.push(product);
            }

            // Gestisci l'inventario se specificata una quantità
            const stockQuantity = sanitizeNumber(body.stockQuantity, 0);
            if (stockQuantity > 0) {
                const location = (body.location || '').trim();
                const bestBefore = (body.bestBefore || '').trim();

                // Cerca se esiste già un item nell'inventario per questo prodotto
                const existingItem = state.items?.find(item =>
                    item.name.toLowerCase() === name.toLowerCase() &&
                    item.bestBefore === bestBefore
                );

                if (existingItem) {
                    // Somma la quantità esistente
                    existingItem.quantity += stockQuantity;
                } else {
                    // Crea un nuovo item nell'inventario
                    const newItem = {
                        id: crypto.randomUUID(),
                        name,
                        quantity: stockQuantity,
                        location,
                        bestBefore: bestBefore || null,
                        createdAt: new Date().toISOString()
                    };
                    state.items = state.items || [];
                    state.items.push(newItem);
                }
            }

            return { product, addedToInventory: stockQuantity > 0 };
        });

        sendJson(res, 201, result);
        return true;
    }
    if (pathname.startsWith('/api/products/') && req.method === 'PATCH') {
        const id = pathname.split('/').pop();
        const body = await parseJsonBody(req);
        const updated = await mutateState((state) => findAndUpdate(state.products, id, (p) => {
            const changes = {};
            if (body.name !== undefined) changes.name = String(body.name).trim() || p.name;
            if (body.barcode !== undefined) changes.barcode = body.barcode ? String(body.barcode).trim() : null;
            if (body.imageUrl !== undefined) changes.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
            if (body.imageSmallUrl !== undefined) changes.imageSmallUrl = body.imageSmallUrl ? String(body.imageSmallUrl).trim() : null;
            if (body.brand !== undefined) changes.brand = body.brand ? String(body.brand).trim() : null;
            if (body.categories !== undefined) changes.categories = body.categories ? String(body.categories).trim() : null;
            if (body.ingredients !== undefined) changes.ingredients = body.ingredients ? String(body.ingredients).trim() : null;
            if (body.allergens !== undefined) changes.allergens = body.allergens ? String(body.allergens).trim() : null;
            if (body.nutritionGrade !== undefined) changes.nutritionGrade = body.nutritionGrade ? String(body.nutritionGrade).trim() : null;
            if (body.energy !== undefined) changes.energy = body.energy ? String(body.energy).trim() : null;
            if (body.energyUnit !== undefined) changes.energyUnit = body.energyUnit ? String(body.energyUnit).trim() : null;
            if (body.quantity !== undefined) changes.quantity = body.quantity ? String(body.quantity).trim() : null;
            if (body.countries !== undefined) changes.countries = body.countries ? String(body.countries).trim() : null;
            if (body.labels !== undefined) changes.labels = body.labels ? String(body.labels).trim() : null;
            if (body.packaging !== undefined) changes.packaging = body.packaging ? String(body.packaging).trim() : null;
            if (body.ecoscore !== undefined) changes.ecoscore = body.ecoscore ? String(body.ecoscore).trim() : null;
            if (body.novaGroup !== undefined) changes.novaGroup = body.novaGroup ? String(body.novaGroup).trim() : null;
            if (body.openFactsUrl !== undefined) changes.openFactsUrl = body.openFactsUrl ? String(body.openFactsUrl).trim() : null;
            if (body.openFactsSource !== undefined) changes.openFactsSource = body.openFactsSource ? String(body.openFactsSource).trim() : null;
            if (body.openFactsLanguage !== undefined) changes.openFactsLanguage = body.openFactsLanguage ? String(body.openFactsLanguage).trim() : null;
            if (body.description !== undefined) changes.description = String(body.description).trim();
            if (body.productGroupId !== undefined) changes.productGroupId = body.productGroupId || null;
            if (body.quantityUnitId !== undefined) changes.quantityUnitId = body.quantityUnitId || null;
            if (body.shoppingLocationId !== undefined) changes.shoppingLocationId = body.shoppingLocationId || null;
            if (body.minStockAmount !== undefined) changes.minStockAmount = sanitizeNumber(body.minStockAmount, p.minStockAmount);
            return changes;
        }));
        if (!updated) return sendError(res, 404, 'Prodotto non trovato');
        sendJson(res, 200, updated); return true;
    }
    if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        const removed = await mutateState((state) => {
            const index = (state.products || []).findIndex((p) => p.id === id);
            if (index === -1) return false;
            state.products.splice(index, 1);
            return true;
        });
        if (!removed) return sendError(res, 404, 'Prodotto non trovato');
        res.statusCode = 204; res.end(); return true;
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
