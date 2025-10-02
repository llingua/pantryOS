/* global React */
(function () {
  const h = React.createElement;

  function SummaryGrid({ summary }) {
    return h(
      'div',
      { className: 'summary-grid' },
      summary.map((item) => h('article', { key: item.label, className: 'summary-card' }, h('p', null, item.label), h('strong', null, item.value)))
    );
  }

  function InventoryGrid({ items, dateFormatter, onConsume, onDelete }) {
    if (!items.length) {
      return h('div', { className: 'empty-state' }, 'La dispensa è vuota. Aggiungi un prodotto.');
    }

    return h(
      'div',
      { className: 'grid' },
      items.map((item) => {
        const isExpired = item.bestBefore && new Date(item.bestBefore) < new Date();
        return h(
          'article',
          { key: item.id, className: 'card' },
          h('h3', null, item.name),
          h('p', { className: 'muted' }, `${Number(item.quantity || 0)} pezzi${item.location ? ` • ${item.location}` : ''}`),
          h('p', { className: 'muted' }, ['Scadenza: ', h('strong', null, item.bestBefore ? dateFormatter.format(new Date(item.bestBefore)) : '—')]),
          isExpired ? h('span', { className: 'badge danger' }, 'Scaduto') : null,
          h('div', { className: 'card-actions' },
            h('button', { className: 'btn ghost', onClick: () => onConsume(item) }, 'Consuma 1'),
            h('button', { className: 'btn danger', onClick: () => onDelete(item) }, 'Rimuovi')
          )
        );
      })
    );
  }

  function ShoppingListGrid({ items, dateFormatter, onToggle, onDelete }) {
    if (!items.length) {
      return h('div', { className: 'empty-state' }, 'La lista della spesa è vuota. Aggiungi un nuovo articolo.');
    }

    return h(
      'div',
      { className: 'grid' },
      items.map((item) => h('article', { key: item.id, className: `card shopping-card${item.completed ? ' completed' : ''}` },
        h('h3', null, item.name),
        h('p', { className: 'muted' }, `${Number(item.quantity || 0)} pezzi`),
        item.createdAt ? h('p', { className: 'muted small' }, dateFormatter.format(new Date(item.createdAt))) : null,
        h('div', { className: 'card-actions' },
          h('button', { className: 'btn ghost', onClick: () => onToggle(item) }, item.completed ? 'Riporta in lista' : 'Segna come acquistato'),
          h('button', { className: 'btn danger', onClick: () => onDelete(item) }, 'Rimuovi')
        )
      ))
    );
  }

  window.PantryOSComponents = window.PantryOSComponents || {};
  window.PantryOSComponents.SummaryGrid = SummaryGrid;
  window.PantryOSComponents.InventoryGrid = InventoryGrid;
  window.PantryOSComponents.ShoppingListGrid = ShoppingListGrid;
})();
