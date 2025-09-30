/* global React, PantryOSComponents */
(function () {
  const { useMemo } = React;
  const h = React.createElement;
  const { InventoryGrid } = PantryOSComponents;

  function InventoryPage({ api, appData, notify }) {
    const dateFormatter = useMemo(() => {
      const locale = appData.config?.culture || 'it';
      try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
      } catch (error) {
        return new Intl.DateTimeFormat('it', { dateStyle: 'medium' });
      }
    }, [appData.config?.culture]);

    return h(
      'div',
      { className: 'page' },
      h('section', { className: 'page-section' },
        h('h2', null, 'Inventario completo'),
        h(InventoryGrid, {
          items: appData.state.items,
          dateFormatter,
          onConsume: (item) => notify(() => api.updateItem(item.id, { quantity: Math.max(0, Number(item.quantity || 0) - 1) }), 'Quantità aggiornata'),
          onDelete: (item) => notify(() => api.deleteItem(item.id), 'Prodotto rimosso'),
        })
      )
    );
  }

  window.PantryOSPages = window.PantryOSPages || {};
  window.PantryOSPages.InventoryPage = InventoryPage;
})();
