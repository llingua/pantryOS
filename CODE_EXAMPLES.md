# PantryOS - Code Examples for ChatGPT

# ===================================

## Backend API Examples

### Health Check Endpoint

```javascript
if (pathname === '/api/health' && req.method === 'GET') {
  sendJson(res, 200, { status: 'ok' });
  return true;
}
```

### State Endpoint

```javascript
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
```

### Add Item Endpoint

```javascript
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
    sendError(
      res,
      400,
      'Impossibile elaborare il prodotto inviato',
      err.message
    );
    return true;
  }
}
```

## Frontend React Examples

### State Management

```javascript
const [payload, setPayload] = useState({
  state: { items: [], shoppingList: [], tasks: [] },
  config: { culture: 'it', currency: 'EUR', timezone: 'Europe/Rome' },
  summary: { items: 0, shoppingList: 0, openTasks: 0 },
});
```

### API Calls

```javascript
async function fetchJson(path, options = {}) {
  const response = await fetch(`${basePath}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const payload = JSON.parse(text);
      throw new Error(payload.error || 'Richiesta non valida');
    } catch (error) {
      throw new Error(text || 'Richiesta non valida');
    }
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
```

### Form Handling

```javascript
function handleItemSubmit(event) {
  event.preventDefault();
  const quantity = Number(itemForm.quantity) || 1;
  withStatus(
    fetchJson('/api/items', {
      method: 'POST',
      body: JSON.stringify({
        name: itemForm.name,
        quantity,
        location: itemForm.location,
        bestBefore: itemForm.bestBefore,
      }),
    }),
    'Prodotto aggiunto con successo'
  );
  setItemForm({ name: '', quantity: 1, location: '', bestBefore: '' });
}
```

## Security Examples

### CSP Headers

```javascript
function setSecurityHeaders(res) {
  const scriptSrc = "'self' https://unpkg.com";
  const styleSrc = "'self' 'unsafe-inline'";
  res.setHeader(
    'Content-Security-Policy',
    [
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
    ].join('; ')
  );
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
}
```

### Input Sanitization

```javascript
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
```

## Management Scripts

### Start Script

```bash
#!/bin/bash
# Avvio PantryOS con modalità semplice o completa
./start.sh simple    # Modalità semplice
./start.sh complete  # Modalità completa
```

### Stop Script

```bash
#!/bin/bash
# Ferma il server PantryOS
./stop.sh
```

### Restart Script

```bash
#!/bin/bash
# Riavvia il server
./restart.sh [mode]
```
