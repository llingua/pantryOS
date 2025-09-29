'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const DATA_FILE = process.env.APP_DATA_FILE || path.join(__dirname, '../data/state.json');
const SCHEMA_FILE = process.env.APP_SCHEMA_FILE || path.join(__dirname, '../data/schema.json');
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

// Schema completo PantryOS
let SCHEMA = {};

// Stato esteso con tutte le entità PantryOS
const defaultState = {
    // Inventario
    items: [],
    shoppingList: [],
    tasks: [],
    
    // Configurazione
    locations: [],
    productGroups: [],
    quantityUnits: [],
    shoppingLocations: [],
    barcodes: [],
    products: [],
    
    // Automazioni
    stockLog: [],
    consumptionLog: [],
    shoppingListLog: [],
    
    // Ricette e pasti
    recipes: [],
    mealPlans: [],
    chores: []
};

let stateQueue = Promise.resolve();

// Funzioni di utilità
function shouldLog(level) {
    const desired = LOG_LEVEL_ORDER.get(LOG_LEVEL) ?? LOG_LEVEL_ORDER.get('info');
    const current = LOG_LEVEL_ORDER.get(level) ?? LOG_LEVEL_ORDER.get('info');
    return current >= desired;
}

function log(level, message, metadata) {
    if (!shouldLog(level)) return;
    const prefix = `[pantryos:${level}]`;
    if (metadata) {
        console.log(prefix, message, metadata);
    } else {
        console.log(prefix, message);
    }
}

// Carica schema iniziale
async function loadSchema() {
    try {
        const schemaData = await fs.promises.readFile(SCHEMA_FILE, 'utf-8');
        SCHEMA = JSON.parse(schemaData);
        log('info', 'Schema PantryOS caricato');
    } catch (err) {
        log('warning', 'Schema non trovato, uso schema vuoto');
        SCHEMA = {};
    }
}

// Gestione stato
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
        
        // Merge con schema se necessario
        if (SCHEMA.locations && SCHEMA.locations.length > 0) {
            state.locations = SCHEMA.locations;
        }
        if (SCHEMA.productGroups && SCHEMA.productGroups.length > 0) {
            state.productGroups = SCHEMA.productGroups;
        }
        if (SCHEMA.quantityUnits && SCHEMA.quantityUnits.length > 0) {
            state.quantityUnits = SCHEMA.quantityUnits;
        }
        if (SCHEMA.shoppingLocations && SCHEMA.shoppingLocations.length > 0) {
            state.shoppingLocations = SCHEMA.shoppingLocations;
        }
        if (SCHEMA.barcodes && SCHEMA.barcodes.length > 0) {
            state.barcodes = SCHEMA.barcodes;
        }
        if (SCHEMA.products && SCHEMA.products.length > 0) {
            state.products = SCHEMA.products;
        }
        
        return state;
    } catch (err) {
        if (err.code === 'ENOENT') {
            log('warning', 'State file missing, creating with schema defaults');
            const initialState = { ...defaultState };
            await writeStateToDisk(initialState);
            return initialState;
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

// Headers di sicurezza
function setSecurityHeaders(res) {
    const scriptSrc = "'self'";
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

// Utility per risposte
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

// Parsing JSON body
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

// Utility per numeri
function sanitizeNumber(value, fallback = 0) {
    if (value === null || value === undefined) return fallback;
    const number = Number(value);
    return Number.isNaN(number) ? fallback : number;
}

// Utility per aggiornamento entità
function findAndUpdate(collection, id, updater) {
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) return false;
    const item = collection[index];
    const updated = updater(item);
    if (updated) {
        collection[index] = { ...item, ...updated };
    }
    return collection[index];
}

// API Handlers per entità PantryOS
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

    // Health check
    if (pathname === '/api/health' && req.method === 'GET') {
        sendJson(res, 200, { status: 'ok' });
        return true;
    }

    // Configurazione
    if (pathname === '/api/config' && req.method === 'GET') {
        sendJson(res, 200, { ...CONFIG });
        return true;
    }

    // Stato completo
    if (pathname === '/api/state' && req.method === 'GET') {
        const state = await getState();
        const summary = {
            items: state.items?.length || 0,
            shoppingList: state.shoppingList?.length || 0,
            openTasks: state.tasks?.filter((task) => !task.completed)?.length || 0,
            locations: state.locations?.length || 0,
            products: state.products?.length || 0,
            recipes: state.recipes?.length || 0
        };
        sendJson(res, 200, { state, config: CONFIG, summary });
        return true;
    }

    // API Locations
    if (pathname === '/api/locations' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.locations);
        return true;
    }

    if (pathname === '/api/locations' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) {
                sendError(res, 400, 'Il nome della location è obbligatorio');
                return true;
            }

            const newLocation = await mutateState((state) => {
                const location = {
                    id: crypto.randomUUID(),
                    name,
                    description: (body.description || '').trim(),
                    isFreezer: Boolean(body.isFreezer),
                    createdAt: new Date().toISOString()
                };
                state.locations.push(location);
                return location;
            });

            sendJson(res, 201, newLocation);
            return true;
        } catch (err) {
            log('error', 'Failed to add location', err);
            sendError(res, 400, 'Impossibile aggiungere la location', err.message);
            return true;
        }
    }

    // API Product Groups
    if (pathname === '/api/product-groups' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.productGroups);
        return true;
    }

    if (pathname === '/api/product-groups' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) {
                sendError(res, 400, 'Il nome del gruppo è obbligatorio');
                return true;
            }

            const newGroup = await mutateState((state) => {
                const group = {
                    id: crypto.randomUUID(),
                    name,
                    description: (body.description || '').trim(),
                    createdAt: new Date().toISOString()
                };
                state.productGroups.push(group);
                return group;
            });

            sendJson(res, 201, newGroup);
            return true;
        } catch (err) {
            log('error', 'Failed to add product group', err);
            sendError(res, 400, 'Impossibile aggiungere il gruppo', err.message);
            return true;
        }
    }

    // API Quantity Units
    if (pathname === '/api/quantity-units' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.quantityUnits);
        return true;
    }

    if (pathname === '/api/quantity-units' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) {
                sendError(res, 400, 'Il nome dell\'unità è obbligatorio');
                return true;
            }

            const newUnit = await mutateState((state) => {
                const unit = {
                    id: crypto.randomUUID(),
                    name,
                    namePlural: body.namePlural || name,
                    description: (body.description || '').trim(),
                    isInteger: Boolean(body.isInteger),
                    createdAt: new Date().toISOString()
                };
                state.quantityUnits.push(unit);
                return unit;
            });

            sendJson(res, 201, newUnit);
            return true;
        } catch (err) {
            log('error', 'Failed to add quantity unit', err);
            sendError(res, 400, 'Impossibile aggiungere l\'unità', err.message);
            return true;
        }
    }

    // API Products
    if (pathname === '/api/products' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.products);
        return true;
    }

    if (pathname === '/api/products' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            if (!name) {
                sendError(res, 400, 'Il nome del prodotto è obbligatorio');
                return true;
            }

            const newProduct = await mutateState((state) => {
                const product = {
                    id: crypto.randomUUID(),
                    name,
                    description: (body.description || '').trim(),
                    productGroupId: body.productGroupId || null,
                    quantityUnitId: body.quantityUnitId || null,
                    shoppingLocationId: body.shoppingLocationId || null,
                    minStockAmount: sanitizeNumber(body.minStockAmount, 0),
                    quFactorPurchaseToStock: sanitizeNumber(body.quFactorPurchaseToStock, 1),
                    quFactorPurchaseToStockId: body.quFactorPurchaseToStockId || null,
                    quFactorStockToConsume: sanitizeNumber(body.quFactorStockToConsume, 1),
                    quFactorStockToConsumeId: body.quFactorStockToConsumeId || null,
                    createdAt: new Date().toISOString()
                };
                state.products.push(product);
                return product;
            });

            sendJson(res, 201, newProduct);
            return true;
        } catch (err) {
            log('error', 'Failed to add product', err);
            sendError(res, 400, 'Impossibile aggiungere il prodotto', err.message);
            return true;
        }
    }

    // API Barcodes
    if (pathname === '/api/barcodes' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.barcodes);
        return true;
    }

    if (pathname === '/api/barcodes' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const barcode = (body.barcode || '').trim();
            if (!barcode) {
                sendError(res, 400, 'Il codice a barre è obbligatorio');
                return true;
            }

            const newBarcode = await mutateState((state) => {
                const barcodeEntry = {
                    id: crypto.randomUUID(),
                    barcode,
                    productId: body.productId || null,
                    createdAt: new Date().toISOString()
                };
                state.barcodes.push(barcodeEntry);
                return barcodeEntry;
            });

            sendJson(res, 201, newBarcode);
            return true;
        } catch (err) {
            log('error', 'Failed to add barcode', err);
            sendError(res, 400, 'Impossibile aggiungere il codice a barre', err.message);
            return true;
        }
    }

    // API Items (inventario) - versione estesa
    if (pathname === '/api/items' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.items);
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

            const newItem = await mutateState((state) => {
                const item = {
                    id: crypto.randomUUID(),
                    name,
                    quantity: sanitizeNumber(body.quantity, 1),
                    location: (body.location || '').trim(),
                    bestBefore: (body.bestBefore || '').trim() || null,
                    productId: body.productId || null,
                    price: sanitizeNumber(body.price, 0),
                    createdAt: new Date().toISOString()
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

    // Shopping List API
    if (pathname === '/api/shopping-list' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.shoppingList);
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

            const entry = await mutateState((state) => {
                const item = {
                    id: crypto.randomUUID(),
                    name,
                    quantity: sanitizeNumber(body.quantity, 1),
                    completed: false,
                    productId: body.productId || null,
                    shoppingLocationId: body.shoppingLocationId || null,
                    createdAt: new Date().toISOString()
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

    // Tasks API
    if (pathname === '/api/tasks' && req.method === 'GET') {
        const state = await getState();
        sendJson(res, 200, state.tasks);
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
                    createdAt: new Date().toISOString()
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

    return false;
}

// File statici
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

// Server principale
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

// Inizializzazione
async function initialize() {
    await loadSchema();
    log('info', 'PantryOS Node.js server initialized with full functionality');
}

// Avvio server
initialize().then(() => {
    server.listen(PORT, HOST, () => {
        log('info', `PantryOS full-featured server listening on http://${HOST}:${PORT}${BASE_PATH || ''}`);
    });
});

server.on('clientError', (err, socket) => {
    log('warning', 'Client connection error', err.message);
    if (socket.writable) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
});

// Costanti per compatibilità
const LOG_LEVEL_ORDER = new Map([
    ['trace', 0],
    ['debug', 1],
    ['info', 2],
    ['notice', 3],
    ['warning', 4],
    ['error', 5],
    ['fatal', 6],
]);

const EXTENSION_CONTENT_TYPES = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'application/javascript; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.ico', 'image/x-icon'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.webmanifest', 'application/manifest+json'],
]);
