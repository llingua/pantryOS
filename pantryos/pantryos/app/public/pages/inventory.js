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

    // Arricchisci gli item dell'inventario con le informazioni dei prodotti (immagini, ecc.)
    const enrichedItems = useMemo(() => {
      const items = appData.state.items || [];
      const products = appData.state.products || [];

      return items.map(item => {
        // Cerca il prodotto corrispondente per nome
        const product = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());

        // Arricchisci l'item con le info del prodotto se trovato
        if (product) {
          return {
            ...item,
            imageUrl: item.imageUrl || product.imageUrl,
            imageSmallUrl: item.imageSmallUrl || product.imageSmallUrl,
            productId: product.id
          };
        }

        return item;
      });
    }, [appData.state.items, appData.state.products]);

    return h(
      'div',
      { className: 'page' },
      h('section', { className: 'page-section' },
        h('h2', null, 'Inventario completo'),
        h(InventoryGrid, {
          items: enrichedItems,
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
