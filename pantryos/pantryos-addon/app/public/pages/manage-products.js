/* global React, PantryOSComponents, PantryOSHelpers */
(function () {
  const { useCallback, useEffect, useState } = React;
  const h = React.createElement;
  const { ProductForm } = PantryOSComponents;
  const { displayUnitLabel } = PantryOSHelpers;

  function MetaRow({ label, value }) {
    return h('div', { className: 'meta-row' }, h('span', null, label), h('strong', null, value));
  }

  function ManageProductsPage({ api, notify }) {
    const [products, setProducts] = useState([]);
    const [refs, setRefs] = useState({ groups: [], units: [], shops: [] });
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
      name: '',
      barcode: '',
      description: '',
      productGroupId: '',
      quantityUnitId: '',
      shoppingLocationId: '',
      minStockAmount: 0,
      quFactorPurchaseToStock: 1,
      quFactorPurchaseToStockId: '',
      quFactorStockToConsume: 1,
      quFactorStockToConsumeId: '',
      imageUrl: '',
      imageSmallUrl: '',
      brand: '',
      categories: '',
      ingredients: '',
      allergens: '',
      nutritionGrade: '',
      energy: '',
      energyUnit: '',
      quantity: '',
      countries: '',
      labels: '',
      packaging: '',
      ecoscore: '',
      novaGroup: '',
      openFactsUrl: '',
      openFactsSource: '',
      openFactsLanguage: '',
    });

    const loadData = useCallback(async () => {
      setLoading(true);
      const [items, groups, units, shops] = await Promise.all([
        api.listProducts(),
        api.listProductGroups(),
        api.listQuantityUnits(),
        api.listShoppingLocations(),
      ]);
      setProducts(items);
      setRefs({ groups, units, shops });
      setLoading(false);
    }, [api]);

    useEffect(() => {
      loadData();
    }, [loadData]);

    const handleSubmit = async (event) => {
      event.preventDefault();
      const payload = {
        name: form.name,
        barcode: form.barcode || null,
        description: form.description,
        productGroupId: form.productGroupId || null,
        quantityUnitId: form.quantityUnitId || null,
        shoppingLocationId: form.shoppingLocationId || null,
        minStockAmount: Number(form.minStockAmount) || 0,
        quFactorPurchaseToStock: Number(form.quFactorPurchaseToStock) || 1,
        quFactorPurchaseToStockId: form.quFactorPurchaseToStockId || null,
        quFactorStockToConsume: Number(form.quFactorStockToConsume) || 1,
        quFactorStockToConsumeId: form.quFactorStockToConsumeId || null,
        imageUrl: form.imageUrl || null,
        imageSmallUrl: form.imageSmallUrl || null,
        brand: form.brand || null,
        categories: form.categories || null,
        ingredients: form.ingredients || null,
        allergens: form.allergens || null,
        nutritionGrade: form.nutritionGrade || null,
        energy: form.energy || null,
        energyUnit: form.energyUnit || null,
        quantity: form.quantity || null,
        countries: form.countries || null,
        labels: form.labels || null,
        packaging: form.packaging || null,
        ecoscore: form.ecoscore || null,
        novaGroup: form.novaGroup || null,
        openFactsUrl: form.openFactsUrl || null,
        openFactsSource: form.openFactsSource || null,
        openFactsLanguage: form.openFactsLanguage || null,
      };
      const action = editing ? () => api.updateProduct(editing.id, payload) : () => api.createProduct(payload);
      const message = editing ? 'Prodotto aggiornato' : 'Prodotto creato';
      const success = await notify(action, message);
      if (success) {
        setForm({
          name: '',
          barcode: '',
          description: '',
          productGroupId: '',
          quantityUnitId: '',
          shoppingLocationId: '',
          minStockAmount: 0,
          quFactorPurchaseToStock: 1,
          quFactorPurchaseToStockId: '',
          quFactorStockToConsume: 1,
          quFactorStockToConsumeId: '',
          imageUrl: '',
          imageSmallUrl: '',
          brand: '',
          categories: '',
          ingredients: '',
          allergens: '',
          nutritionGrade: '',
          energy: '',
          energyUnit: '',
          quantity: '',
          countries: '',
          labels: '',
          packaging: '',
          ecoscore: '',
          novaGroup: '',
          openFactsUrl: '',
          openFactsSource: '',
          openFactsLanguage: '',
        });
        setEditing(null);
        loadData();
      }
    };

    const handleDelete = async (product) => {
      const success = await notify(() => api.deleteProduct(product.id), 'Prodotto eliminato');
      if (success) loadData();
    };

    return h(
      'div',
      { className: 'page' },
      h('section', { className: 'page-section' },
        h('h2', null, 'Prodotti'),
        h('p', { className: 'section-subtitle' }, 'Definisci il catalogo prodotti disponibile per la dispensa.'),
        h(
          'form',
          { className: 'form-grid card form-stacked', onSubmit: handleSubmit },
          h(ProductForm, {
            form,
            refs,
            onFieldChange: (key, value) => setForm((state) => ({ ...state, [key]: value })),
          }),
          h('div', { className: 'form-actions' },
            editing ? h('button', {
              type: 'button',
              className: 'btn ghost',
              onClick: () => {
                setEditing(null);
                setForm({
                  name: '',
                  barcode: '',
                  description: '',
                  productGroupId: '',
                  quantityUnitId: '',
                  shoppingLocationId: '',
                  minStockAmount: 0,
                  quFactorPurchaseToStock: 1,
                  quFactorPurchaseToStockId: '',
                  quFactorStockToConsume: 1,
                  quFactorStockToConsumeId: '',
                });
              },
            }, 'Annulla') : null,
            h('button', { type: 'submit', className: 'btn primary' }, editing ? 'Aggiorna prodotto' : 'Crea prodotto')
          )
        )
      ),
      h('section', { className: 'page-section' },
        loading ? h('p', null, 'Caricamento prodotti...') : h('div', { className: 'entity-grid' },
          products.map((product) => h('div', { key: product.id, className: 'card' },
            h('h3', null, product.name),
            product.description ? h('p', { className: 'muted' }, product.description) : null,
            h('dl', { className: 'meta-list' },
              product.productGroupId ? h(MetaRow, { label: 'Gruppo', value: (refs.groups.find((g) => g.id === product.productGroupId) || {}).name || '—' }) : null,
              product.quantityUnitId ? h(MetaRow, { label: 'Unità', value: (refs.units.find((u) => u.id === product.quantityUnitId) || {}).name || '—' }) : null,
              product.shoppingLocationId ? h(MetaRow, { label: 'Negozio', value: (refs.shops.find((s) => s.id === product.shoppingLocationId) || {}).name || '—' }) : null,
              h(MetaRow, { label: 'Scorta minima', value: product.minStockAmount || 0 }),
              h(MetaRow, {
                label: 'Acquisto → Stock',
                value: `${product.quFactorPurchaseToStock ?? 1} ${displayUnitLabel(refs.units, product.quFactorPurchaseToStockId)}`
              }),
              h(MetaRow, {
                label: 'Stock → Consumo',
                value: `${product.quFactorStockToConsume ?? 1} ${displayUnitLabel(refs.units, product.quFactorStockToConsumeId)}`
              })
            ),
            h('div', { className: 'card-actions' },
              h('button', { className: 'btn ghost', onClick: () => {
                setEditing(product);
                setForm({
                  name: product.name,
                  barcode: product.barcode || '',
                  description: product.description || '',
                  productGroupId: product.productGroupId || '',
                  quantityUnitId: product.quantityUnitId || '',
                  shoppingLocationId: product.shoppingLocationId || '',
                  minStockAmount: product.minStockAmount ?? 0,
                  quFactorPurchaseToStock: product.quFactorPurchaseToStock ?? 1,
                  quFactorPurchaseToStockId: product.quFactorPurchaseToStockId || '',
                  quFactorStockToConsume: product.quFactorStockToConsume ?? 1,
                  quFactorStockToConsumeId: product.quFactorStockToConsumeId || '',
                  imageUrl: product.imageUrl || '',
                  imageSmallUrl: product.imageSmallUrl || '',
                  brand: product.brand || '',
                  categories: product.categories || '',
                  ingredients: product.ingredients || '',
                  allergens: product.allergens || '',
                  nutritionGrade: product.nutritionGrade || '',
                  energy: product.energy || '',
                  energyUnit: product.energyUnit || '',
                  quantity: product.quantity || '',
                  countries: product.countries || '',
                  labels: product.labels || '',
                  packaging: product.packaging || '',
                  ecoscore: product.ecoscore || '',
                  novaGroup: product.novaGroup || '',
                  openFactsUrl: product.openFactsUrl || '',
                  openFactsSource: product.openFactsSource || '',
                  openFactsLanguage: product.openFactsLanguage || '',
                });
              } }, 'Modifica'),
              h('button', { className: 'btn danger', onClick: () => handleDelete(product) }, 'Elimina')
            )
          ))
        )
      )
    );
  }

  window.PantryOSPages = window.PantryOSPages || {};
  window.PantryOSPages.ManageProductsPage = ManageProductsPage;
})();
