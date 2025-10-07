/* global React, PantryOSComponents */
(function () {
  const { useCallback, useEffect, useMemo, useState } = React;
  const h = React.createElement;
  const { ProductForm, Modal, SummaryGrid, InventoryGrid, ShoppingListGrid } = PantryOSComponents;

  function DashboardPage({ api, appData, notify }) {
    const [itemForm, setItemForm] = useState({
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
    const [shoppingForm, setShoppingForm] = useState({ name: '', quantity: 1 });
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [shoppingModalOpen, setShoppingModalOpen] = useState(false);
    const [refs, setRefs] = useState({
      locations: [],
      groups: [],
      units: [],
      shops: [],
    });

    const dateFormatter = useMemo(() => {
      const locale = appData.config?.culture || 'it';
      try {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
      } catch (error) {
        console.warn('Falling back to default locale because of', error);
        return new Intl.DateTimeFormat('it', { dateStyle: 'medium' });
      }
    }, [appData.config?.culture]);


    const loadRefs = useCallback(async () => {
      const [locations, groups, units, shops] = await Promise.all([
        api.listLocations(),
        api.listProductGroups(),
        api.listQuantityUnits(),
        api.listShoppingLocations(),
      ]);
      setRefs({ locations, groups, units, shops });
    }, [api]);

    useEffect(() => {
      loadRefs();
    }, [loadRefs]);

    const handleItemConfirm = async () => {
      const payload = {
        name: itemForm.name,
        barcode: itemForm.barcode || null,
        description: itemForm.description,
        productGroupId: itemForm.productGroupId || null,
        quantityUnitId: itemForm.quantityUnitId || null,
        shoppingLocationId: itemForm.shoppingLocationId || null,
        minStockAmount: Number(itemForm.minStockAmount) || 0,
        quFactorPurchaseToStock: Number(itemForm.quFactorPurchaseToStock) || 1,
        quFactorPurchaseToStockId: itemForm.quFactorPurchaseToStockId || null,
        quFactorStockToConsume: Number(itemForm.quFactorStockToConsume) || 1,
        quFactorStockToConsumeId: itemForm.quFactorStockToConsumeId || null,
        imageUrl: itemForm.imageUrl || null,
        imageSmallUrl: itemForm.imageSmallUrl || null,
        brand: itemForm.brand || null,
        categories: itemForm.categories || null,
        ingredients: itemForm.ingredients || null,
        allergens: itemForm.allergens || null,
        nutritionGrade: itemForm.nutritionGrade || null,
        energy: itemForm.energy || null,
        energyUnit: itemForm.energyUnit || null,
        quantity: itemForm.quantity || null,
        countries: itemForm.countries || null,
        labels: itemForm.labels || null,
        packaging: itemForm.packaging || null,
        ecoscore: itemForm.ecoscore || null,
        novaGroup: itemForm.novaGroup || null,
        openFactsUrl: itemForm.openFactsUrl || null,
        openFactsSource: itemForm.openFactsSource || null,
        openFactsLanguage: itemForm.openFactsLanguage || null,
      };
      const success = await notify(() => api.createProduct(payload), 'Prodotto creato con successo');
      if (success) {
        setItemForm({
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
        setItemModalOpen(false);
      }
    };

    const handleShoppingConfirm = async () => {
      const payload = {
        name: shoppingForm.name,
        quantity: Number(shoppingForm.quantity) || 1,
      };
      const success = await notify(() => api.createShoppingEntry(payload), 'Articolo aggiunto alla lista');
      if (success) {
        setShoppingForm({ name: '', quantity: 1 });
        setShoppingModalOpen(false);
      }
    };

    return h(
      'div',
      { className: 'page' },
      h('section', { className: 'page-section' },
        h('h2', null, 'Riepilogo rapido'),
        h(SummaryGrid, {
          summary: [
            { label: 'Prodotti in dispensa', value: appData.summary.items },
            { label: 'Articoli in lista', value: appData.summary.shoppingList },
          ],
        })
      ),
      h('section', { className: 'page-section two-columns' },
        h('div', { className: 'card' },
          h('h3', null, 'Aggiungi prodotto'),
          h('p', { className: 'muted' }, 'Apri la modale per registrare rapidamente un prodotto.'),
          h('button', { className: 'btn primary', onClick: () => setItemModalOpen(true) }, 'Nuovo prodotto')
        ),
        h('div', { className: 'card' },
          h('h3', null, 'Aggiungi alla lista della spesa'),
          h('p', { className: 'muted' }, 'Apri la modale per aggiungere un articolo alla lista della spesa.'),
          h('button', { className: 'btn primary', onClick: () => setShoppingModalOpen(true) }, 'Nuovo articolo lista spesa')
        )
      ),
      h('section', { className: 'page-section' },
        h('h2', null, 'Inventario'),
        h(InventoryGrid, {
          items: appData.state.items,
          dateFormatter,
          onConsume: (item) => notify(() => api.updateItem(item.id, { quantity: Math.max(0, Number(item.quantity || 0) - 1) }), 'Quantità aggiornata'),
          onDelete: (item) => notify(() => api.deleteItem(item.id), 'Prodotto rimosso'),
        })
      ),
      h('section', { className: 'page-section' },
        h('h2', null, 'Lista della spesa'),
        h(ShoppingListGrid, {
          items: appData.state.shoppingList,
          dateFormatter,
          onToggle: (entry) => notify(() => api.updateShoppingEntry(entry.id, { completed: !entry.completed }), entry.completed ? 'Articolo riaperto' : 'Articolo completato'),
          onDelete: (entry) => notify(() => api.deleteShoppingEntry(entry.id), 'Articolo rimosso'),
        })
      ),
      h(Modal, {
        open: itemModalOpen,
        title: 'Nuovo prodotto',
        confirmLabel: 'Salva prodotto',
        onClose: () => {
          setItemModalOpen(false);
          setItemForm({
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
        onConfirm: handleItemConfirm,
      },
        h('div', { className: 'form-grid form-stacked' },
          h(ProductForm, {
            form: itemForm,
            refs,
            onFieldChange: (key, value) => setItemForm((state) => ({ ...state, [key]: value })),
          })
        )
      ),
      h(Modal, {
        open: shoppingModalOpen,
        title: 'Nuovo articolo lista spesa',
        confirmLabel: 'Aggiungi alla lista',
        onClose: () => {
          setShoppingModalOpen(false);
          setShoppingForm({ name: '', quantity: 1 });
        },
        onConfirm: handleShoppingConfirm,
      },
        h('div', { className: 'form-grid' },
          h('input', {
            required: true,
            placeholder: 'Articolo',
            value: shoppingForm.name,
            onChange: (event) => setShoppingForm((form) => ({ ...form, name: event.target.value })),
          }),
          h('input', {
            type: 'number',
            min: 1,
            value: shoppingForm.quantity,
            onChange: (event) => setShoppingForm((form) => ({ ...form, quantity: event.target.value })),
          })
        )
      )
    );
  }

  window.PantryOSPages = window.PantryOSPages || {};
  window.PantryOSPages.DashboardPage = DashboardPage;
})();
