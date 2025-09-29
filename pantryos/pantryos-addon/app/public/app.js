/* global React, ReactDOM */
(function () {
  const { useEffect, useMemo, useState } = React;
  const h = React.createElement;

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const basePath = (() => {
    const { pathname } = window.location;
    if (!pathname || pathname === '/') {
      return '';
    }
    if (pathname.endsWith('/index.html')) {
      return pathname.replace(/\/index\.html$/, '');
    }
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  })();

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

  function formatDate(dateString, formatter) {
    if (!dateString) {
      return '—';
    }
    try {
      return formatter.format(new Date(dateString));
    } catch (error) {
      console.warn('Invalid date received', dateString);
      return dateString;
    }
  }

  function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [payload, setPayload] = useState({
      state: { items: [], shoppingList: [], tasks: [] },
      config: { culture: 'it', currency: 'EUR', timezone: 'Europe/Rome' },
      summary: { items: 0, shoppingList: 0, openTasks: 0 },
    });

    const [itemForm, setItemForm] = useState({
      name: '',
      quantity: 1,
      location: '',
      bestBefore: '',
    });

    const [shoppingForm, setShoppingForm] = useState({
      name: '',
      quantity: 1,
    });

    const [taskForm, setTaskForm] = useState({
      name: '',
      dueDate: '',
    });

    const dateFormatter = useMemo(() => {
      const locale = payload.config?.culture || 'it';
      try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
      } catch (error) {
        console.warn('Falling back to default locale because of', error);
        return new Intl.DateTimeFormat('it', { dateStyle: 'medium' });
      }
    }, [payload.config?.culture]);

    const currencyFormatter = useMemo(() => {
      const locale = payload.config?.culture || 'it';
      const currency = payload.config?.currency || 'EUR';
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
        });
      } catch (error) {
        console.warn('Unable to format currency', error);
        return {
          format(value) {
            return `${value.toFixed(2)} ${currency}`;
          },
        };
      }
    }, [payload.config?.culture, payload.config?.currency]);

    const inventoryValue = useMemo(() => {
      if (!payload.state.items.length) {
        return 0;
      }
      return payload.state.items.reduce((total, item) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        return total + quantity * price;
      }, 0);
    }, [payload.state.items]);

    async function loadState() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchJson('/api/state');
        setPayload(data);
      } catch (err) {
        console.error('Unable to load application state', err);
        setError('Impossibile caricare i dati. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      loadState();
    }, []);

    function withStatus(promise, successMessage) {
      return promise
        .then(async () => {
          setMessage(successMessage);
          await loadState();
          setTimeout(() => setMessage(''), 4000);
        })
        .catch((err) => {
          console.error('Operation failed', err);
          setError(err.message || 'Operazione non riuscita');
          setTimeout(() => setError(''), 5000);
        });
    }

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

    function handleShoppingSubmit(event) {
      event.preventDefault();
      const quantity = Number(shoppingForm.quantity) || 1;
      withStatus(
        fetchJson('/api/shopping-list', {
          method: 'POST',
          body: JSON.stringify({
            name: shoppingForm.name,
            quantity,
          }),
        }),
        'Articolo aggiunto alla lista'
      );
      setShoppingForm({ name: '', quantity: 1 });
    }

    function handleTaskSubmit(event) {
      event.preventDefault();
      withStatus(
        fetchJson('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            name: taskForm.name,
            dueDate: taskForm.dueDate,
          }),
        }),
        'Attività pianificata'
      );
      setTaskForm({ name: '', dueDate: '' });
    }

    function consumeItem(item) {
      const nextQuantity = Math.max(0, Number(item.quantity || 0) - 1);
      return withStatus(
        fetchJson(`/api/items/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: nextQuantity }),
        }),
        nextQuantity === 0
          ? `${item.name} esaurito`
          : `Aggiornata la quantità di ${item.name}`
      );
    }

    function deleteItem(item) {
      return withStatus(
        fetchJson(`/api/items/${item.id}`, { method: 'DELETE' }),
        `${item.name} rimosso dalla dispensa`
      );
    }

    function toggleShopping(item) {
      return withStatus(
        fetchJson(`/api/shopping-list/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: !item.completed }),
        }),
        item.completed
          ? `${item.name} riportato nella lista`
          : `${item.name} acquistato`
      );
    }

    function removeShopping(item) {
      return withStatus(
        fetchJson(`/api/shopping-list/${item.id}`, { method: 'DELETE' }),
        `${item.name} rimosso dalla lista`
      );
    }

    function toggleTask(task) {
      return withStatus(
        fetchJson(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: !task.completed }),
        }),
        task.completed ? 'Attività riaperta' : 'Attività completata'
      );
    }

    function removeTask(task) {
      return withStatus(
        fetchJson(`/api/tasks/${task.id}`, { method: 'DELETE' }),
        'Attività eliminata'
      );
    }

    function renderInventory() {
      if (!payload.state.items.length) {
        return h('div', { className: 'empty-state' }, 'La dispensa è vuota. Aggiungi un prodotto.');
      }

      return h(
        'div',
        { className: 'section-grid' },
        payload.state.items.map((item) => {
          const bestBefore = formatDate(item.bestBefore, dateFormatter);
          const isExpired = item.bestBefore && new Date(item.bestBefore) < new Date();
          const quantity = Number(item.quantity || 0);

          return h(
            'article',
            { key: item.id, className: 'card' },
            h('div', { className: 'badge' }, 'Dispensa'),
            h('h3', null, item.name),
            h('span', null, quantity === 1 ? '1 pezzo' : `${quantity} pezzi`),
            h(
              'div',
              { className: 'meta' },
              item.location
                ? h('span', null, ['Posizione: ', h('strong', null, item.location)])
                : null,
              h(
                'span',
                null,
                ['Scadenza: ', h('strong', null, bestBefore)]
              ),
              item.price
                ? h(
                    'span',
                    null,
                    ['Valore: ', h('strong', null, currencyFormatter.format(Number(item.price) || 0))]
                  )
                : null,
              isExpired
                ? h(
                    'span',
                    { className: 'status-pill warning' },
                    'Scaduto'
                  )
                : null
            ),
            h(
              'div',
              { className: 'actions' },
              h(
                'button',
                {
                  className: 'secondary',
                  type: 'button',
                  onClick: () => consumeItem(item),
                },
                'Consuma 1'
              ),
              h(
                'button',
                {
                  className: 'secondary',
                  type: 'button',
                  onClick: () => deleteItem(item),
                },
                'Rimuovi'
              )
            )
          );
        })
      );
    }

    function renderShoppingList() {
      if (!payload.state.shoppingList.length) {
        return h(
          'div',
          { className: 'empty-state' },
          'La lista della spesa è vuota. Aggiungi un nuovo articolo.'
        );
      }

      return h(
        'div',
        { className: 'section-grid' },
        payload.state.shoppingList.map((item) =>
          h(
            'article',
            { key: item.id, className: 'card' },
            h('div', { className: 'badge' }, 'Spesa'),
            h(
              'div',
              { className: 'meta' },
              h('span', null, item.createdAt ? formatDate(item.createdAt, dateFormatter) : 'Nuovo'),
              h('span', null, `${Number(item.quantity || 0)} pezzi`)
            ),
            h(
              'h3',
              null,
              item.name
            ),
            h(
              'div',
              { className: 'actions' },
              h(
                'button',
                {
                  className: item.completed ? 'secondary' : 'success',
                  type: 'button',
                  onClick: () => toggleShopping(item),
                },
                item.completed ? 'Riporta in lista' : 'Segna come acquistato'
              ),
              h(
                'button',
                {
                  className: 'secondary',
                  type: 'button',
                  onClick: () => removeShopping(item),
                },
                'Rimuovi'
              )
            )
          )
        )
      );
    }

    function renderTasks() {
      if (!payload.state.tasks.length) {
        return h(
          'div',
          { className: 'empty-state' },
          'Nessuna attività pianificata. Aggiungi un nuovo promemoria.'
        );
      }

      return h(
        'div',
        { className: 'section-grid' },
        payload.state.tasks.map((task) => {
          const dueDate = formatDate(task.dueDate, dateFormatter);
          const isDueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 2 * 86400000);
          const pillClass = task.completed ? 'status-pill success' : isDueSoon ? 'status-pill warning' : 'status-pill muted';
          const pillLabel = task.completed ? 'Completata' : isDueSoon ? 'In scadenza' : 'Pianificata';

          return h(
            'article',
            { key: task.id, className: 'card' },
            h('div', { className: 'badge' }, 'Attività'),
            h('h3', null, task.name),
            h(
              'div',
              { className: 'meta' },
              h('span', null, ['Scadenza: ', h('strong', null, dueDate)]),
              h('span', { className: pillClass }, pillLabel)
            ),
            h(
              'div',
              { className: 'actions' },
              h(
                'button',
                {
                  className: task.completed ? 'secondary' : 'success',
                  type: 'button',
                  onClick: () => toggleTask(task),
                },
                task.completed ? 'Riapri attività' : 'Completa'
              ),
              h(
                'button',
                {
                  className: 'secondary',
                  type: 'button',
                  onClick: () => removeTask(task),
                },
                'Elimina'
              )
            )
          );
        })
      );
    }

    if (loading) {
      return h(
        'div',
        { className: 'dashboard' },
        h(
          'section',
          { className: 'section' },
          h('h2', null, 'Caricamento in corso...')
        )
      );
    }

    return h(
      'main',
      { className: 'dashboard' },
      h(
        'section',
        { className: 'header' },
        h(
          'div',
          null,
          h('h1', null, 'PantryOS Node Edition'),
          h(
            'p',
            null,
            'Gestione della dispensa, lista della spesa e attività domestiche, riscritta in Node.js e React.'
          )
        ),
        h(
          'div',
          { className: 'summary-cards' },
          h(
            'article',
            { className: 'summary-card' },
            h('h2', null, 'Prodotti in dispensa'),
            h('strong', null, payload.summary.items)
          ),
          h(
            'article',
            { className: 'summary-card' },
            h('h2', null, 'Lista della spesa'),
            h('strong', null, payload.summary.shoppingList)
          ),
          h(
            'article',
            { className: 'summary-card' },
            h('h2', null, 'Attività aperte'),
            h('strong', null, payload.summary.openTasks)
          ),
          h(
            'article',
            { className: 'summary-card' },
            h('h2', null, 'Valore stimato dispensa'),
            h('strong', null, currencyFormatter.format(inventoryValue))
          )
        )
      ),
      error
        ? h(
            'section',
            { className: 'section' },
            h('p', { className: 'status-pill warning' }, error)
          )
        : null,
      message
        ? h(
            'section',
            { className: 'section' },
            h('p', { className: 'status-pill success' }, message)
          )
        : null,
      h(
        'section',
        { className: 'section' },
        h(
          'div',
          { className: 'section-header' },
          h('div', null, h('h2', null, 'Dispensa'), h('p', null, 'Tieni sotto controllo quello che hai in casa.')),
          h(
            'form',
            { className: 'form-grid', onSubmit: handleItemSubmit },
            h(
              'div',
              { className: 'form-row' },
              h('input', {
                required: true,
                placeholder: 'Nome prodotto',
                value: itemForm.name,
                onChange: (event) => setItemForm((form) => ({ ...form, name: event.target.value })),
              }),
              h('input', {
                type: 'number',
                min: 1,
                value: itemForm.quantity,
                onChange: (event) => setItemForm((form) => ({ ...form, quantity: event.target.value })),
                placeholder: 'Quantità',
              }),
              h('input', {
                placeholder: 'Posizione',
                value: itemForm.location,
                onChange: (event) => setItemForm((form) => ({ ...form, location: event.target.value })),
              }),
              h('input', {
                type: 'date',
                value: itemForm.bestBefore,
                onChange: (event) => setItemForm((form) => ({ ...form, bestBefore: event.target.value })),
              })
            ),
            h(
              'div',
              { className: 'actions' },
              h('button', { type: 'submit', className: 'success' }, 'Aggiungi prodotto')
            )
          )
        ),
        renderInventory()
      ),
      h(
        'section',
        { className: 'section' },
        h(
          'div',
          { className: 'section-header' },
          h('div', null, h('h2', null, 'Lista della spesa'), h('p', null, 'Organizza gli acquisti della settimana.')),
          h(
            'form',
            { className: 'form-grid', onSubmit: handleShoppingSubmit },
            h(
              'div',
              { className: 'form-row' },
              h('input', {
                required: true,
                placeholder: 'Articolo da acquistare',
                value: shoppingForm.name,
                onChange: (event) => setShoppingForm((form) => ({ ...form, name: event.target.value })),
              }),
              h('input', {
                type: 'number',
                min: 1,
                value: shoppingForm.quantity,
                onChange: (event) => setShoppingForm((form) => ({ ...form, quantity: event.target.value })),
                placeholder: 'Quantità',
              })
            ),
            h(
              'div',
              { className: 'actions' },
              h('button', { type: 'submit', className: 'success' }, 'Aggiungi alla lista')
            )
          )
        ),
        renderShoppingList()
      ),
      h(
        'section',
        { className: 'section' },
        h(
          'div',
          { className: 'section-header' },
          h('div', null, h('h2', null, 'Attività domestiche'), h('p', null, 'Promemoria per la cura della casa.')),
          h(
            'form',
            { className: 'form-grid', onSubmit: handleTaskSubmit },
            h(
              'div',
              { className: 'form-row' },
              h('input', {
                required: true,
                placeholder: 'Nome attività',
                value: taskForm.name,
                onChange: (event) => setTaskForm((form) => ({ ...form, name: event.target.value })),
              }),
              h('input', {
                type: 'date',
                value: taskForm.dueDate,
                onChange: (event) => setTaskForm((form) => ({ ...form, dueDate: event.target.value })),
              })
            ),
            h(
              'div',
              { className: 'actions' },
              h('button', { type: 'submit', className: 'success' }, 'Aggiungi attività')
            )
          )
        ),
        renderTasks()
      )
    );
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(h(Dashboard));
})();
