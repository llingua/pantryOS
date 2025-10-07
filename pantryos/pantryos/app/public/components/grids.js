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
      { className: 'product-card-grid' },
      items.map((item) => {
        const isExpired = item.bestBefore && new Date(item.bestBefore) < new Date();
        const imageUrl = item.imageSmallUrl || item.imageUrl;

        return h(
          'article',
          { key: item.id, className: 'product-card' },
          h('div', { className: 'product-card-image' },
            imageUrl
              ? h('img', { src: imageUrl, alt: item.name, loading: 'lazy' })
              : h('div', { className: 'product-card-placeholder' },
                  h('i', { className: 'ti ti-package' })
                )
          ),
          h('div', { className: 'product-card-content' },
            h('h3', { className: 'product-card-title' }, item.name),
            h('div', { className: 'product-card-meta' },
              h('span', { className: 'product-card-quantity' },
                h('i', { className: 'ti ti-box' }),
                ` ${Number(item.quantity || 0)}`
              ),
              item.location ? h('span', { className: 'product-card-location' },
                h('i', { className: 'ti ti-map-pin' }),
                ` ${item.location}`
              ) : null,
              item.bestBefore ? h('span', {
                className: `product-card-expiry${isExpired ? ' expired' : ''}`
              },
                h('i', { className: 'ti ti-calendar' }),
                ` Scad: ${dateFormatter.format(new Date(item.bestBefore))}`
              ) : null
            )
          ),
          h('div', { className: 'product-card-actions' },
            h('button', {
              className: 'btn-icon-text ghost',
              onClick: () => onConsume(item),
              title: 'Consuma 1'
            },
              h('i', { className: 'ti ti-minus' })
            ),
            h('button', {
              className: 'btn-icon danger',
              onClick: () => onDelete(item),
              title: 'Elimina'
            },
              h('i', { className: 'ti ti-trash' })
            )
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
