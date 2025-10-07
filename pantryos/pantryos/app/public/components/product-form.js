/* global React, PantryOSComponents */
(function () {
  const { useState } = React;
  const h = React.createElement;

  function FormField({ label, required, children }) {
    return h('label', { className: 'form-field-stacked' },
      h('span', null, label, required ? h('span', { className: 'required-indicator' }, ' *') : null),
      children
    );
  }

  function ProductForm({ form, onFieldChange, refs }) {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
      basic: true,
      advanced: false,
      openfacts: false,
    });
    const { BarcodeScannerModal } = PantryOSComponents;

    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    const update = (key) => (event) => {
      const value = event && event.target ? event.target.type === 'checkbox' ? event.target.checked : event.target.value : event;
      onFieldChange(key, value);
    };

    const handleBarcodeDetected = (code) => {
      onFieldChange('barcode', code);
      setScannerOpen(false);
    };

    const handleProductFound = (barcode, productData) => {
      // Popola automaticamente i campi con i dati trovati
      if (productData && !productData.error) {
        const updates = {
          barcode: barcode,
          name: productData.name || '',
          description: productData.description || '',
          imageUrl: productData.imageUrl || '',
          imageSmallUrl: productData.imageSmallUrl || '',
          brand: productData.brand || '',
          categories: productData.categories || '',
          ingredients: productData.ingredients || '',
          allergens: productData.allergens || '',
          nutritionGrade: productData.nutritionGrade || '',
          energy: productData.energy || '',
          energyUnit: productData.energyUnit || '',
          quantity: productData.quantity || '',
          countries: productData.countries || '',
          labels: productData.labels || '',
          packaging: productData.packaging || '',
          ecoscore: productData.ecoscore || '',
          novaGroup: productData.novaGroup || '',
          openFactsUrl: productData.url || '',
          openFactsSource: productData.source || '',
          openFactsLanguage: productData.language || '',
        };

        // Applica gli aggiornamenti
        Object.keys(updates).forEach(key => {
          onFieldChange(key, updates[key]);
        });

        console.log('📦 Dati prodotto applicati:', updates);
      }

      setScannerOpen(false);
    };

    return h(React.Fragment, null,
      // Sezione Base - Sempre visibile
      h('div', { className: 'collapsible-section' },
        h('button', {
          type: 'button',
          className: 'section-toggle active',
          onClick: () => toggleSection('basic')
        },
          h('i', { className: `section-toggle-icon ti ${expandedSections.basic ? 'ti-chevron-down' : 'ti-chevron-right'}` }),
          h('span', { className: 'section-toggle-label' }, h('i', { className: 'ti ti-file-text', style: { marginRight: '0.5rem' } }), 'Informazioni Base'),
          h('span', { className: 'required-indicator' }, ' *')
        ),
        expandedSections.basic ? h('div', { className: 'section-content' },
          h(FormField, {
            label: 'Nome prodotto',
            required: true,
            children: h('input', {
              required: true,
              placeholder: 'Nome prodotto',
              value: form.name,
              onChange: update('name'),
            }),
          }),
          h(FormField, {
            label: 'Codice a barre',
            children: h('div', { className: 'barcode-field' },
              h('input', {
                type: 'text',
                placeholder: 'Inserisci o scansiona il codice a barre',
                value: form.barcode || '',
                onChange: update('barcode'),
                className: 'barcode-input',
              }),
              h('button', {
                type: 'button',
                className: 'btn ghost barcode-scanner-btn',
                onClick: () => setScannerOpen(true),
                title: 'Scansiona codice a barre',
              },
                h('i', { className: 'barcode-scanner-icon ti ti-camera' }),
                h('span', { className: 'barcode-scanner-text' }, 'Scansiona')
              )
            ),
          }),
          h(FormField, {
            label: 'Descrizione',
            children: h('textarea', {
              rows: 2,
              placeholder: 'Descrizione (opzionale)',
              value: form.description,
              onChange: update('description'),
            }),
          }),
          h(FormField, {
            label: 'Unità di misura',
            children: h('select', {
              value: form.quantityUnitId,
              onChange: update('quantityUnitId'),
            },
              h('option', { value: '' }, 'Seleziona (opzionale)'),
              (refs.units || []).map((unit) => h('option', { key: unit.id, value: unit.id }, unit.name))
            ),
          }),
          h(FormField, {
            label: 'Stock iniziale',
            children: h('div', { className: 'number-input-field' },
              h('button', {
                type: 'button',
                className: 'number-input-btn number-input-decrease',
                onClick: () => {
                  const currentValue = parseFloat(form.quFactorStockToConsume) || 0;
                  const newValue = Math.max(0, currentValue - 1);
                  update('quFactorStockToConsume')({ target: { value: newValue.toString() } });
                },
                title: 'Decrementa',
                'aria-label': 'Decrementa stock'
              }, h('i', { className: 'ti ti-minus' })),
              h('input', {
                type: 'number',
                min: 0,
                step: '0.01',
                placeholder: '0',
                value: form.quFactorStockToConsume,
                onChange: update('quFactorStockToConsume'),
                className: 'number-input',
              }),
              h('button', {
                type: 'button',
                className: 'number-input-btn number-input-increase',
                onClick: () => {
                  const currentValue = parseFloat(form.quFactorStockToConsume) || 0;
                  const newValue = currentValue + 1;
                  update('quFactorStockToConsume')({ target: { value: newValue.toString() } });
                },
                title: 'Incrementa',
                'aria-label': 'Incrementa stock'
              }, h('i', { className: 'ti ti-plus' }))
            ),
          }),
          h(FormField, {
            label: 'Data di scadenza',
            children: h('input', {
              type: 'date',
              value: form.bestBefore || '',
              onChange: update('bestBefore'),
              className: 'date-input',
            }),
          })
        ) : null
      ),

      // Sezione Avanzata - Collassabile
      h('div', { className: 'collapsible-section' },
        h('button', {
          type: 'button',
          className: 'section-toggle',
          onClick: () => toggleSection('advanced')
        },
          h('i', { className: `section-toggle-icon ti ${expandedSections.advanced ? 'ti-chevron-down' : 'ti-chevron-right'}` }),
          h('span', { className: 'section-toggle-label' }, h('i', { className: 'ti ti-adjustments', style: { marginRight: '0.5rem' } }), 'Impostazioni Avanzate')
        ),
        expandedSections.advanced ? h('div', { className: 'section-content' },
          h(FormField, {
            label: 'Gruppo prodotto',
            children: h('select', {
              value: form.productGroupId,
              onChange: update('productGroupId'),
            },
              h('option', { value: '' }, 'Seleziona (opzionale)'),
              (refs.groups || []).map((group) => h('option', { key: group.id, value: group.id }, group.name))
            ),
          }),
          h(FormField, {
            label: 'Negozio di riferimento',
            children: h('select', {
              value: form.shoppingLocationId,
              onChange: update('shoppingLocationId'),
            },
              h('option', { value: '' }, 'Seleziona (opzionale)'),
              (refs.shops || []).map((shop) => h('option', { key: shop.id, value: shop.id }, shop.name))
            ),
          }),
          h(FormField, {
            label: 'Scorta minima',
            children: h('input', {
              type: 'number',
              min: 0,
              placeholder: '0',
              value: form.minStockAmount,
              onChange: update('minStockAmount'),
            }),
          }),
          h('div', { style: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' } },
            h('p', { style: { margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-muted)' } }, 'Fattori di conversione')
          ),
          h(FormField, {
            label: 'Fattore acquisto → stock',
            children: h('input', {
              type: 'number',
              min: 0,
              step: '0.01',
              placeholder: '1',
              value: form.quFactorPurchaseToStock,
              onChange: update('quFactorPurchaseToStock'),
            }),
          }),
          h(FormField, {
            label: 'Unità fattore acquisto',
            children: h('select', {
              value: form.quFactorPurchaseToStockId,
              onChange: update('quFactorPurchaseToStockId'),
            },
              h('option', { value: '' }, 'Seleziona (opzionale)'),
              (refs.units || []).map((unit) => h('option', { key: unit.id, value: unit.id }, unit.name))
            ),
          }),
          h(FormField, {
            label: 'Fattore stock → consumo',
            children: h('input', {
              type: 'number',
              min: 0,
              step: '0.01',
              placeholder: '1',
              value: form.quFactorStockToConsume,
              onChange: update('quFactorStockToConsume'),
            }),
          }),
          h(FormField, {
            label: 'Unità fattore consumo',
            children: h('select', {
              value: form.quFactorStockToConsumeId,
              onChange: update('quFactorStockToConsumeId'),
            },
              h('option', { value: '' }, 'Seleziona (opzionale)'),
              (refs.units || []).map((unit) => h('option', { key: unit.id, value: unit.id }, unit.name))
            ),
          })
        ) : null
      ),

      // Sezione Open Facts - Collassabile
      h('div', { className: 'collapsible-section' },
        h('button', {
          type: 'button',
          className: 'section-toggle',
          onClick: () => toggleSection('openfacts')
        },
          h('i', { className: `section-toggle-icon ti ${expandedSections.openfacts ? 'ti-chevron-down' : 'ti-chevron-right'}` }),
          h('span', { className: 'section-toggle-label' }, h('i', { className: 'ti ti-database', style: { marginRight: '0.5rem' } }), 'Dati Open Facts')
        ),
        expandedSections.openfacts ? h('div', { className: 'section-content' },
          h(FormField, {
            label: 'Immagine prodotto',
            children: h('div', { className: 'image-field' },
              form.imageUrl ? h('img', {
                src: form.imageSmallUrl || form.imageUrl,
                alt: form.name || 'Prodotto',
                className: 'product-image-preview',
                onError: (e) => { e.target.style.display = 'none'; }
              }) : null,
              h('input', {
                type: 'url',
                placeholder: 'URL immagine',
                value: form.imageUrl || '',
                onChange: update('imageUrl'),
              })
            ),
          }),
          h(FormField, {
            label: 'Marca',
            children: h('input', {
              type: 'text',
              placeholder: 'Marca',
              value: form.brand || '',
              onChange: update('brand'),
            }),
          }),
          h(FormField, {
            label: 'Categorie',
            children: h('input', {
              type: 'text',
              placeholder: 'Categorie',
              value: form.categories || '',
              onChange: update('categories'),
            }),
          }),
          h(FormField, {
            label: 'Quantità',
            children: h('input', {
              type: 'text',
              placeholder: 'Es. 500ml, 1kg',
              value: form.quantity || '',
              onChange: update('quantity'),
            }),
          }),
          h(FormField, {
            label: 'Ingredienti',
            children: h('textarea', {
              rows: 2,
              placeholder: 'Lista ingredienti',
              value: form.ingredients || '',
              onChange: update('ingredients'),
            }),
          }),
          h(FormField, {
            label: 'Allergeni',
            children: h('input', {
              type: 'text',
              placeholder: 'Es. Latte, Glutine',
              value: form.allergens || '',
              onChange: update('allergens'),
            }),
          }),
          h(FormField, {
            label: 'Grado nutrizionale',
            children: h('input', {
              type: 'text',
              placeholder: 'A, B, C, D, E',
              maxLength: 1,
              value: form.nutritionGrade || '',
              onChange: update('nutritionGrade'),
            }),
          }),
          h(FormField, {
            label: 'Ecoscore',
            children: h('input', {
              type: 'text',
              placeholder: 'A, B, C, D, E',
              maxLength: 1,
              value: form.ecoscore || '',
              onChange: update('ecoscore'),
            }),
          }),
          h(FormField, {
            label: 'Energia',
            children: h('input', {
              type: 'text',
              placeholder: 'Valore energetico',
              value: form.energy || '',
              onChange: update('energy'),
            }),
          }),
          h(FormField, {
            label: 'Paesi',
            children: h('input', {
              type: 'text',
              placeholder: 'Paesi di origine',
              value: form.countries || '',
              onChange: update('countries'),
            }),
          }),
          h(FormField, {
            label: 'Etichette',
            children: h('input', {
              type: 'text',
              placeholder: 'Es. Bio, Fair Trade',
              value: form.labels || '',
              onChange: update('labels'),
            }),
          }),
          h(FormField, {
            label: 'Packaging',
            children: h('input', {
              type: 'text',
              placeholder: 'Tipo di confezionamento',
              value: form.packaging || '',
              onChange: update('packaging'),
            }),
          })
        ) : null
      ),
      BarcodeScannerModal ? h(BarcodeScannerModal, {
        open: scannerOpen,
        onClose: () => setScannerOpen(false),
        onDetected: handleBarcodeDetected,
        onProductFound: handleProductFound,
      }) : null
    );
  }

  window.PantryOSComponents = window.PantryOSComponents || {};
  window.PantryOSComponents.ProductForm = ProductForm;
  window.PantryOSComponents.FormField = FormField;
})();
