/* global React, BarcodeScanner, OpenFactsAPI */
(function () {
  const { useEffect, useRef, useState } = React;
  const h = React.createElement;

  function BarcodeScannerModal({ open, onClose, onDetected, onProductFound }) {
    const containerRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [detectedCode, setDetectedCode] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);

    useEffect(() => {
      if (!open) {
        // Cleanup quando si chiude
        if (isScanning) {
          BarcodeScanner.stop();
          setIsScanning(false);
        }
        setDetectedCode('');
        setError('');
        setManualCode('');
        return;
      }

      // Verifica supporto
      if (!BarcodeScanner.isSupported()) {
        setError('La fotocamera non è supportata su questo dispositivo. Usa l\'inserimento manuale.');
        return;
      }

      // Handler per barcode rilevato
      const handleBarcodeDetected = async (event) => {
        const code = event.detail.code;
        console.log('Barcode rilevato:', code);
        setDetectedCode(code);

        // Ferma lo scanner
        BarcodeScanner.stop();
        setIsScanning(false);

        // Cerca automaticamente i dati del prodotto
        await searchProductData(code);
      };

      // Aggiungi listener
      document.addEventListener('barcodeDetected', handleBarcodeDetected);

      // Inizia scansione
      const startScanning = async () => {
        try {
          setError('');
          await BarcodeScanner.init('barcode-scanner-container');
          await BarcodeScanner.start();
          setIsScanning(true);
        } catch (err) {
          console.error('Errore avvio scanner:', err);
          if (err.name === 'NotAllowedError') {
            setError('Permessi fotocamera negati. Clicca "Consenti" quando richiesto dal browser, oppure usa l\'inserimento manuale.');
          } else if (err.name === 'NotFoundError') {
            setError('Nessuna fotocamera trovata. Usa l\'inserimento manuale.');
          } else {
            setError('Impossibile avviare la fotocamera: ' + err.message + '. Usa l\'inserimento manuale.');
          }
          setIsScanning(false);
        }
      };

      startScanning();

      // Cleanup
      return () => {
        document.removeEventListener('barcodeDetected', handleBarcodeDetected);
        if (isScanning) {
          BarcodeScanner.stop();
        }
      };
    }, [open, isScanning, onDetected]);

    const searchProductData = async (barcode) => {
      if (!barcode || !OpenFactsAPI) {
        // Fallback: notifica solo il barcode
        if (onDetected) {
          onDetected(barcode);
        }
        return;
      }

      setIsSearching(true);
      setSearchResult(null);

      try {
        console.log('🔍 Ricerca dati prodotto per barcode:', barcode);
        const productData = await OpenFactsAPI.searchProductByBarcode(barcode);

        console.log('✅ Dati prodotto trovati:', productData);
        setSearchResult(productData);

        // Notifica il parent con i dati completi
        if (onProductFound) {
          onProductFound(barcode, productData);
        } else if (onDetected) {
          onDetected(barcode);
        }

      } catch (error) {
        console.warn('⚠️ Errore ricerca prodotto:', error.message);
        setSearchResult({ error: error.message });

        // Fallback: notifica solo il barcode
        if (onDetected) {
          onDetected(barcode);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const handleManualSubmit = async () => {
      if (manualCode.trim()) {
        await searchProductData(manualCode.trim());
        setManualCode('');
      }
    };

    if (!open) return null;

    return h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal barcode-modal' },
        h('div', { className: 'modal-header' },
          h('h3', null, 'Scansiona Codice a Barre'),
          h('button', {
            className: 'modal-close',
            type: 'button',
            onClick: () => {
              BarcodeScanner.stop();
              setIsScanning(false);
              onClose();
            }
          }, '×')
        ),
        h('div', { className: 'modal-body' },
          error ? h('div', { className: 'alert alert-error' }, error) : null,
          detectedCode ? h('div', { className: 'alert alert-success' },
            h('strong', null, 'Codice rilevato: '),
            detectedCode
          ) : null,
          isSearching ? h('div', { className: 'alert alert-info' },
            h('div', { className: 'loading-spinner' }),
            '🔍 Ricerca dati prodotto...'
          ) : null,
          searchResult && !searchResult.error ? h('div', { className: 'alert alert-success' },
            h('strong', null, '✅ Prodotto trovato!'),
            h('br'),
            h('strong', null, searchResult.name),
            searchResult.brand ? h('p', { className: 'muted' }, `Marca: ${searchResult.brand}`) : null,
            searchResult.description ? h('p', { className: 'muted' }, searchResult.description) : null,
            searchResult.imageUrl ? h('img', {
              src: searchResult.imageSmallUrl || searchResult.imageUrl,
              alt: searchResult.name,
              style: { maxWidth: '100px', maxHeight: '100px', marginTop: '0.5rem' }
            }) : null
          ) : null,
          searchResult && searchResult.error ? h('div', { className: 'alert alert-warning' },
            h('strong', null, '⚠️ Prodotto non trovato'),
            h('br'),
            h('span', { className: 'muted' }, searchResult.error)
          ) : null,
          !error ? h('div', {
            id: 'barcode-scanner-container',
            ref: containerRef,
            className: 'scanner-container'
          }) : null,
          !error ? h('div', { className: 'scanner-instructions' },
            h('p', null, '📸 Posiziona il codice a barre davanti alla fotocamera'),
            h('p', { className: 'muted' }, 'Assicurati che il codice sia ben illuminato e a fuoco'),
            h('p', { className: 'muted' }, 'I dati del prodotto verranno cercati automaticamente')
          ) : null,
          h('div', { className: 'manual-input-section' },
            h('h4', null, 'Inserimento manuale'),
            h('p', { className: 'muted' }, 'Se la fotocamera non funziona, inserisci il codice manualmente:'),
            h('div', { className: 'input-with-button' },
              h('input', {
                type: 'text',
                placeholder: 'Inserisci il codice a barre',
                value: manualCode,
                onChange: (e) => setManualCode(e.target.value),
                onKeyPress: (e) => e.key === 'Enter' && handleManualSubmit()
              }),
              h('button', {
                type: 'button',
                className: 'btn primary',
                onClick: handleManualSubmit,
                disabled: !manualCode.trim()
              }, 'Inserisci')
            )
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', {
            className: 'btn ghost',
            type: 'button',
            onClick: () => {
              BarcodeScanner.stop();
              setIsScanning(false);
              onClose();
            }
          }, 'Chiudi')
        )
      )
    );
  }

  window.PantryOSComponents = window.PantryOSComponents || {};
  window.PantryOSComponents.BarcodeScannerModal = BarcodeScannerModal;
})();
