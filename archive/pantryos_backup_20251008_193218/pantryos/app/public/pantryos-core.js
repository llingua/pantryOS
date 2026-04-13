/* global React, ReactDOM */
(function () {
  const { useEffect, useMemo, useState, useCallback } = React;
  const h = React.createElement;

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  // Base path detection
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

  // API utilities
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

  // Utility functions
  function formatDate(dateString, formatter) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (formatter === 'date') {
      return date.toLocaleDateString('it-IT');
    }
    if (formatter === 'datetime') {
      return date.toLocaleString('it-IT');
    }
    return date.toLocaleDateString('it-IT');
  }

  // Barcode Scanner Component - REALE con QuaggaJS
  function BarcodeScanner({ onBarcodeDetected, onClose }) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [lastDetected, setLastDetected] = useState(null);

    const startScanner = useCallback(async () => {
      try {
        setError(null);
        
        // Verifica che QuaggaJS sia caricato
        if (typeof Quagga === 'undefined') {
          // Aspetta che QuaggaJS sia caricato
          await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 secondi
            
            const checkQuagga = () => {
              if (typeof Quagga !== 'undefined') {
                resolve();
              } else if (attempts >= maxAttempts) {
                reject(new Error('QuaggaJS non è stato caricato dopo 5 secondi'));
              } else {
                attempts++;
                setTimeout(checkQuagga, 100);
              }
            };
            
            checkQuagga();
          });
        }
        
        // Verifica supporto camera
        if (!window.BarcodeScanner.isSupported()) {
          throw new Error('Camera non supportata su questo dispositivo');
        }

        // Inizializza QuaggaJS
        await window.BarcodeScanner.init('scanner-container', {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-container'),
            constraints: {
              width: 640,
              height: 480,
              facingMode: "environment"
            }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader", 
              "ean_8_reader",
              "code_39_reader",
              "upc_reader",
              "upc_e_reader"
            ]
          }
        });

        // Avvia scanner
        await window.BarcodeScanner.start();
        setIsScanning(true);
        setIsInitialized(true);

        // Listener per barcode rilevati
        const handleBarcodeDetected = (event) => {
          const code = event.detail.code;
          console.log('Barcode rilevato:', code);
          setLastDetected(code);
          onBarcodeDetected(code);
        };

        document.addEventListener('barcodeDetected', handleBarcodeDetected);

        // Cleanup listener
        return () => {
          document.removeEventListener('barcodeDetected', handleBarcodeDetected);
        };

      } catch (err) {
        console.error('Errore inizializzazione scanner:', err);
        setError('Errore inizializzazione scanner: ' + err.message);
      }
    }, [onBarcodeDetected]);

    const stopScanner = useCallback(() => {
      if (isInitialized) {
        window.BarcodeScanner.stop();
        setIsScanning(false);
        setIsInitialized(false);
      }
    }, [isInitialized]);

    const pauseScanner = useCallback(() => {
      if (isScanning) {
        window.BarcodeScanner.pause();
      }
    }, [isScanning]);

    const resumeScanner = useCallback(() => {
      if (isInitialized && !isScanning) {
        window.BarcodeScanner.resume();
        setIsScanning(true);
      }
    }, [isInitialized, isScanning]);

    // Test con barcode simulato
    const testScan = useCallback(() => {
      const testCodes = [
        '8001234567890',
        '1234567890123', 
        '9876543210987'
      ];
      const randomCode = testCodes[Math.floor(Math.random() * testCodes.length)];
      window.BarcodeScanner.simulateDetection(randomCode);
    }, []);

    useEffect(() => {
      return () => {
        if (isInitialized) {
          window.BarcodeScanner.stop();
        }
      };
    }, [isInitialized]);

    return h('div', { className: 'barcode-scanner-overlay' },
      h('div', { className: 'barcode-scanner-modal' },
        h('div', { className: 'barcode-scanner-header' },
          h('h3', null, 'Scanner Codice a Barre Reale'),
          h('button', { 
            className: 'btn-close',
            onClick: onClose 
          }, '×')
        ),
        h('div', { className: 'barcode-scanner-content' },
          error ? h('div', { className: 'error' }, error) : null,
          
          // Container per QuaggaJS
          h('div', { 
            id: 'scanner-container',
            className: 'scanner-container',
            style: { 
              width: '100%', 
              maxWidth: '500px', 
              height: '300px',
              backgroundColor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '1rem 0'
            }
          }),
          
          // Overlay di rilevamento
          h('div', { className: 'scanner-overlay' },
            h('div', { className: 'scanner-line' })
          ),
          
          // Controlli
          h('div', { className: 'scanner-controls' },
            !isScanning ? h('button', {
              className: 'btn btn-primary',
              onClick: startScanner
            }, 'Avvia Scanner') : null,
            
            isScanning ? h('button', {
              className: 'btn btn-secondary',
              onClick: stopScanner
            }, 'Ferma Scanner') : null,
            
            isScanning ? h('button', {
              className: 'btn btn-warning',
              onClick: pauseScanner
            }, 'Pausa') : null,
            
            !isScanning && isInitialized ? h('button', {
              className: 'btn btn-success',
              onClick: resumeScanner
            }, 'Riprendi') : null,
            
            h('button', {
              className: 'btn btn-info',
              onClick: testScan
            }, 'Test Scan')
          ),
          
          // Info
          h('div', { className: 'scanner-info' },
            h('p', null, 'Punta la camera verso un codice a barre'),
            h('p', null, 'Formati supportati: EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E'),
            lastDetected ? h('div', { className: 'last-detected' },
              h('strong', null, 'Ultimo rilevato: '),
              h('code', null, lastDetected)
            ) : null
          )
        )
      )
    );
  }

  // Product Form Component
  function ProductForm({ product, onSave, onCancel }) {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      description: product?.description || '',
      productGroupId: product?.productGroupId || '',
      quantityUnitId: product?.quantityUnitId || '',
      shoppingLocationId: product?.shoppingLocationId || '',
      minStockAmount: product?.minStockAmount || 0,
      ...product
    });

    const [locations, setLocations] = useState([]);
    const [productGroups, setProductGroups] = useState([]);
    const [quantityUnits, setQuantityUnits] = useState([]);
    const [shoppingLocations, setShoppingLocations] = useState([]);

    useEffect(() => {
      // Carica dati per i dropdown
      Promise.all([
        fetchJson('/api/locations'),
        fetchJson('/api/product-groups'),
        fetchJson('/api/quantity-units'),
        fetchJson('/api/shopping-locations')
      ]).then(([locs, groups, units, shops]) => {
        setLocations(locs);
        setProductGroups(groups);
        setQuantityUnits(units);
        setShoppingLocations(shops);
      }).catch(console.error);
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    return h('form', { className: 'product-form', onSubmit: handleSubmit },
      h('div', { className: 'form-group' },
        h('label', null, 'Nome Prodotto *'),
        h('input', {
          type: 'text',
          value: formData.name,
          onChange: (e) => setFormData({...formData, name: e.target.value}),
          required: true
        })
      ),
      h('div', { className: 'form-group' },
        h('label', null, 'Descrizione'),
        h('textarea', {
          value: formData.description,
          onChange: (e) => setFormData({...formData, description: e.target.value}),
          rows: 3
        })
      ),
      h('div', { className: 'form-row' },
        h('div', { className: 'form-group' },
          h('label', null, 'Gruppo Prodotto'),
          h('select', {
            value: formData.productGroupId,
            onChange: (e) => setFormData({...formData, productGroupId: e.target.value})
          },
            h('option', { value: '' }, 'Seleziona gruppo'),
            productGroups.map(group => 
              h('option', { key: group.id, value: group.id }, group.name)
            )
          )
        ),
        h('div', { className: 'form-group' },
          h('label', null, 'Unità di Misura'),
          h('select', {
            value: formData.quantityUnitId,
            onChange: (e) => setFormData({...formData, quantityUnitId: e.target.value})
          },
            h('option', { value: '' }, 'Seleziona unità'),
            quantityUnits.map(unit => 
              h('option', { key: unit.id, value: unit.id }, unit.name)
            )
          )
        )
      ),
      h('div', { className: 'form-row' },
        h('div', { className: 'form-group' },
          h('label', null, 'Location Shopping'),
          h('select', {
            value: formData.shoppingLocationId,
            onChange: (e) => setFormData({...formData, shoppingLocationId: e.target.value})
          },
            h('option', { value: '' }, 'Seleziona location'),
            shoppingLocations.map(location => 
              h('option', { key: location.id, value: location.id }, location.name)
            )
          )
        ),
        h('div', { className: 'form-group' },
          h('label', null, 'Scorta Minima'),
          h('input', {
            type: 'number',
            value: formData.minStockAmount,
            onChange: (e) => setFormData({...formData, minStockAmount: Number(e.target.value)}),
            min: 0
          })
        )
      ),
      h('div', { className: 'form-actions' },
        h('button', { type: 'button', className: 'btn btn-secondary', onClick: onCancel }, 'Annulla'),
        h('button', { type: 'submit', className: 'btn btn-primary' }, 'Salva')
      )
    );
  }

  // Location Management Component
  function LocationManager() {
    const [locations, setLocations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);

    useEffect(() => {
      loadLocations();
    }, []);

    const loadLocations = async () => {
      try {
        const data = await fetchJson('/api/locations');
        setLocations(data);
      } catch (error) {
        console.error('Errore caricamento locations:', error);
      }
    };

    const handleSave = async (locationData) => {
      try {
        if (editingLocation) {
          // Update existing
          await fetchJson(`/api/locations/${editingLocation.id}`, {
            method: 'PATCH',
            body: JSON.stringify(locationData)
          });
        } else {
          // Create new
          await fetchJson('/api/locations', {
            method: 'POST',
            body: JSON.stringify(locationData)
          });
        }
        await loadLocations();
        setShowForm(false);
        setEditingLocation(null);
      } catch (error) {
        console.error('Errore salvataggio location:', error);
      }
    };

    return h('div', { className: 'location-manager' },
      h('div', { className: 'section-header' },
        h('h2', null, 'Gestione Locations'),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => setShowForm(true)
        }, 'Aggiungi Location')
      ),
      showForm ? h(LocationForm, {
        location: editingLocation,
        onSave: handleSave,
        onCancel: () => {
          setShowForm(false);
          setEditingLocation(null);
        }
      }) : null,
      h('div', { className: 'locations-grid' },
        locations.map(location => 
          h('div', { key: location.id, className: 'location-card' },
            h('h3', null, location.name),
            h('p', null, location.description),
            h('div', { className: 'location-actions' },
              h('button', {
                className: 'btn btn-sm btn-secondary',
                onClick: () => {
                  setEditingLocation(location);
                  setShowForm(true);
                }
              }, 'Modifica'),
              h('button', {
                className: 'btn btn-sm btn-danger',
                onClick: () => deleteLocation(location.id)
              }, 'Elimina')
            )
          )
        )
      )
    );
  }

  // Location Form Component
  function LocationForm({ location, onSave, onCancel }) {
    const [formData, setFormData] = useState({
      name: location?.name || '',
      description: location?.description || '',
      isFreezer: location?.isFreezer || false
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    return h('form', { className: 'location-form', onSubmit: handleSubmit },
      h('div', { className: 'form-group' },
        h('label', null, 'Nome Location *'),
        h('input', {
          type: 'text',
          value: formData.name,
          onChange: (e) => setFormData({...formData, name: e.target.value}),
          required: true
        })
      ),
      h('div', { className: 'form-group' },
        h('label', null, 'Descrizione'),
        h('textarea', {
          value: formData.description,
          onChange: (e) => setFormData({...formData, description: e.target.value}),
          rows: 3
        })
      ),
      h('div', { className: 'form-group' },
        h('label', { className: 'checkbox-label' },
          h('input', {
            type: 'checkbox',
            checked: formData.isFreezer,
            onChange: (e) => setFormData({...formData, isFreezer: e.target.checked})
          }),
          ' È un freezer'
        )
      ),
      h('div', { className: 'form-actions' },
        h('button', { type: 'button', className: 'btn btn-secondary', onClick: onCancel }, 'Annulla'),
        h('button', { type: 'submit', className: 'btn btn-primary' }, 'Salva')
      )
    );
  }

  // Main App Component
  function PantryOSApp() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [showScanner, setShowScanner] = useState(false);
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadState();
    }, []);

    const loadState = async () => {
      try {
        const data = await fetchJson('/api/state');
        setState(data.state);
        setLoading(false);
      } catch (error) {
        console.error('Errore caricamento stato:', error);
        setLoading(false);
      }
    };

    const handleBarcodeDetected = async (barcode) => {
      try {
        // Cerca prodotto per barcode
        const barcodes = await fetchJson('/api/barcodes');
        const barcodeEntry = barcodes.find(b => b.barcode === barcode);
        
        if (barcodeEntry) {
          // Prodotto trovato, mostra dettagli
          alert(`Prodotto trovato: ${barcodeEntry.productId}`);
        } else {
          // Barcode non trovato, chiedi se aggiungere
          const addNew = confirm(`Barcode ${barcode} non trovato. Vuoi aggiungere un nuovo prodotto?`);
          if (addNew) {
            // Apri form nuovo prodotto
            setCurrentView('products');
          }
        }
        setShowScanner(false);
      } catch (error) {
        console.error('Errore ricerca barcode:', error);
        setShowScanner(false);
      }
    };

    if (loading) {
      return h('div', { className: 'loading' }, 'Caricamento...');
    }

    return h('div', { className: 'pantryos-app' },
      h('header', { className: 'app-header' },
        h('h1', null, 'PantryOS Node.js'),
        h('nav', { className: 'main-nav' },
          h('button', {
            className: `nav-btn ${currentView === 'dashboard' ? 'active' : ''}`,
            onClick: () => setCurrentView('dashboard')
          }, 'Dashboard'),
          h('button', {
            className: `nav-btn ${currentView === 'inventory' ? 'active' : ''}`,
            onClick: () => setCurrentView('inventory')
          }, 'Inventario'),
          h('button', {
            className: `nav-btn ${currentView === 'shopping' ? 'active' : ''}`,
            onClick: () => setCurrentView('shopping')
          }, 'Lista Spesa'),
          h('button', {
            className: `nav-btn ${currentView === 'products' ? 'active' : ''}`,
            onClick: () => setCurrentView('products')
          }, 'Prodotti'),
          h('button', {
            className: `nav-btn ${currentView === 'locations' ? 'active' : ''}`,
            onClick: () => setCurrentView('locations')
          }, 'Locations'),
          h('button', {
            className: 'nav-btn scanner-btn',
            onClick: () => setShowScanner(true)
          }, '📱 Scanner')
        )
      ),
      h('main', { className: 'app-main' },
        currentView === 'dashboard' ? h(Dashboard, { state, onRefresh: loadState }) : null,
        currentView === 'inventory' ? h(Inventory, { state, onRefresh: loadState }) : null,
        currentView === 'shopping' ? h(ShoppingList, { state, onRefresh: loadState }) : null,
        currentView === 'products' ? h(Products, { state, onRefresh: loadState }) : null,
        currentView === 'locations' ? h(LocationManager) : null
      ),
      showScanner ? h(BarcodeScanner, {
        onBarcodeDetected: handleBarcodeDetected,
        onClose: () => setShowScanner(false)
      }) : null
    );
  }

  // Dashboard Component
  function Dashboard({ state, onRefresh }) {
    const summary = state ? {
      items: state.items?.length || 0,
      shoppingList: state.shoppingList?.length || 0,
      openTasks: state.tasks?.filter(task => !task.completed)?.length || 0,
      locations: state.locations?.length || 0,
      products: state.products?.length || 0
    } : {};

    return h('div', { className: 'dashboard' },
      h('h2', null, 'Dashboard'),
      h('div', { className: 'stats-grid' },
        h('div', { className: 'stat-card' },
          h('h3', null, summary.items),
          h('p', null, 'Items in Inventario')
        ),
        h('div', { className: 'stat-card' },
          h('h3', null, summary.shoppingList),
          h('p', null, 'Articoli da Comprare')
        ),
        h('div', { className: 'stat-card' },
          h('h3', null, summary.openTasks),
          h('p', null, 'Task Aperti')
        ),
        h('div', { className: 'stat-card' },
          h('h3', null, summary.locations),
          h('p', null, 'Locations')
        ),
        h('div', { className: 'stat-card' },
          h('h3', null, summary.products),
          h('p', null, 'Prodotti')
        )
      )
    );
  }

  // Inventory Component
  function Inventory({ state, onRefresh }) {
    const [items, setItems] = useState(state?.items || []);

    const addItem = async (itemData) => {
      try {
        const newItem = await fetchJson('/api/items', {
          method: 'POST',
          body: JSON.stringify(itemData)
        });
        setItems([...items, newItem]);
        onRefresh();
      } catch (error) {
        console.error('Errore aggiunta item:', error);
      }
    };

    return h('div', { className: 'inventory' },
      h('h2', null, 'Inventario'),
      h('div', { className: 'inventory-grid' },
        items.map(item => 
          h('div', { key: item.id, className: 'item-card' },
            h('h3', null, item.name),
            h('p', null, `Quantità: ${item.quantity}`),
            h('p', null, `Location: ${item.location}`),
            item.bestBefore ? h('p', null, `Scadenza: ${formatDate(item.bestBefore, 'date')}`) : null
          )
        )
      )
    );
  }

  // Shopping List Component
  function ShoppingList({ state, onRefresh }) {
    const [shoppingList, setShoppingList] = useState(state?.shoppingList || []);

    return h('div', { className: 'shopping-list' },
      h('h2', null, 'Lista Spesa'),
      h('div', { className: 'shopping-grid' },
        shoppingList.map(item => 
          h('div', { key: item.id, className: `shopping-item ${item.completed ? 'completed' : ''}` },
            h('h3', null, item.name),
            h('p', null, `Quantità: ${item.quantity}`)
          )
        )
      )
    );
  }

  // Products Component
  function Products({ state, onRefresh }) {
    const [products, setProducts] = useState(state?.products || []);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const handleSave = async (productData) => {
      try {
        if (editingProduct) {
          await fetchJson(`/api/products/${editingProduct.id}`, {
            method: 'PATCH',
            body: JSON.stringify(productData)
          });
        } else {
          await fetchJson('/api/products', {
            method: 'POST',
            body: JSON.stringify(productData)
          });
        }
        await loadProducts();
        setShowForm(false);
        setEditingProduct(null);
      } catch (error) {
        console.error('Errore salvataggio prodotto:', error);
      }
    };

    const loadProducts = async () => {
      try {
        const data = await fetchJson('/api/products');
        setProducts(data);
      } catch (error) {
        console.error('Errore caricamento prodotti:', error);
      }
    };

    useEffect(() => {
      loadProducts();
    }, []);

    return h('div', { className: 'products' },
      h('h2', null, 'Prodotti'),
      h('button', {
        className: 'btn btn-primary',
        onClick: () => setShowForm(true)
      }, 'Aggiungi Prodotto'),
      showForm ? h(ProductForm, {
        product: editingProduct,
        onSave: handleSave,
        onCancel: () => {
          setShowForm(false);
          setEditingProduct(null);
        }
      }) : null,
      h('div', { className: 'products-grid' },
        products.map(product => 
          h('div', { key: product.id, className: 'product-card' },
            h('h3', null, product.name),
            h('p', null, product.description),
            h('button', {
              className: 'btn btn-sm btn-secondary',
              onClick: () => {
                setEditingProduct(product);
                setShowForm(true);
              }
            }, 'Modifica')
          )
        )
      )
    );
  }

  // Inizializza app direttamente (le librerie sono già caricate)
  console.log('Inizializzazione app PantryOS...');
  ReactDOM.render(h(PantryOSApp), rootElement);
})();
