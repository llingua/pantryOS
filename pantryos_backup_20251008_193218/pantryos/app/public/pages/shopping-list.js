/* global React, PantryOSComponents */
(function () {
  const { useMemo, useState } = React;
  const h = React.createElement;
  const { ShoppingListGrid } = PantryOSComponents;

  function ShoppingListPage({ api, appData, notify }) {
    const dateFormatter = useMemo(() => {
      const locale = appData.config?.culture || 'it';
      try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
      } catch (error) {
        return new Intl.DateTimeFormat('it', { dateStyle: 'medium' });
      }
    }, [appData.config?.culture]);

    const [form, setForm] = useState({ name: '', quantity: 1 });

    const handleSubmit = async (event) => {
      event.preventDefault();
      const success = await notify(
        () => api.createShoppingEntry({ name: form.name, quantity: Number(form.quantity) || 1 }),
        'Articolo aggiunto alla lista'
      );
      if (success) setForm({ name: '', quantity: 1 });
    };

    return h(
      'div',
      { className: 'page' },
      h('section', { className: 'page-section two-columns' },
        h('div', { className: 'card' },
          h('h3', null, 'Nuovo articolo'),
          h('form', { className: 'form-grid', onSubmit: handleSubmit },
            h('input', {
              required: true,
              placeholder: 'Articolo da acquistare',
              value: form.name,
              onChange: (event) => setForm((state) => ({ ...state, name: event.target.value })),
            }),
            h('input', {
              type: 'number',
              min: 1,
              value: form.quantity,
              onChange: (event) => setForm((state) => ({ ...state, quantity: event.target.value })),
            }),
            h('button', { type: 'submit', className: 'btn primary' }, 'Aggiungi alla lista')
          )
        )
      ),
      h('section', { className: 'page-section' },
        h('h2', null, 'Lista corrente'),
        h(ShoppingListGrid, {
          items: appData.state.shoppingList,
          dateFormatter,
          onToggle: (entry) => notify(() => api.updateShoppingEntry(entry.id, { completed: !entry.completed }), entry.completed ? 'Articolo riaperto' : 'Articolo completato'),
          onDelete: (entry) => notify(() => api.deleteShoppingEntry(entry.id), 'Articolo rimosso'),
        })
      )
    );
  }

  window.PantryOSPages = window.PantryOSPages || {};
  window.PantryOSPages.ShoppingListPage = ShoppingListPage;
})();
