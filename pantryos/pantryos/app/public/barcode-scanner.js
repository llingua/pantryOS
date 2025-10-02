/* global Quagga */
(function () {
  'use strict';

  // Barcode Scanner Reale con QuaggaJS
  window.BarcodeScanner = {
    isSupported: function() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    init: function(containerId, options = {}) {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container ${containerId} not found`);
      }

      const defaultOptions = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: container,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment" // Camera posteriore
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
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true
      };

      const config = { ...defaultOptions, ...options };
      
      return new Promise((resolve, reject) => {
        if (typeof Quagga === 'undefined') {
          reject(new Error('QuaggaJS non è disponibile'));
          return;
        }
        
        Quagga.init(config, (err) => {
          if (err) {
            console.error('Quagga initialization error:', err);
            reject(err);
            return;
          }
          
          console.log('Quagga initialized successfully');
          resolve();
        });
      });
    },

    start: function() {
      return new Promise((resolve, reject) => {
        if (typeof Quagga === 'undefined') {
          reject(new Error('QuaggaJS non è disponibile'));
          return;
        }
        
        Quagga.start();
        
        // Listener per barcode rilevati
        Quagga.onDetected((data) => {
          const code = data.codeResult.code;
          console.log('Barcode detected:', code);
          
          // Emetti evento personalizzato
          const event = new CustomEvent('barcodeDetected', {
            detail: { code: code, data: data }
          });
          document.dispatchEvent(event);
        });

        // Listener per errori
        Quagga.onProcessed((result) => {
          if (result && result.boxes) {
            // Aggiorna overlay con box detection
            this.updateOverlay(result.boxes);
          }
        });

        resolve();
      });
    },

    stop: function() {
      if (typeof Quagga !== 'undefined') {
        Quagga.stop();
      }
    },

    pause: function() {
      if (typeof Quagga !== 'undefined') {
        Quagga.pause();
      }
    },

    resume: function() {
      if (typeof Quagga !== 'undefined') {
        Quagga.resume();
      }
    },

    updateOverlay: function(boxes) {
      // Aggiorna overlay con box di rilevamento
      const overlay = document.querySelector('.scanner-overlay');
      if (overlay) {
        // Implementazione overlay dinamico
        this.drawOverlay(overlay, boxes);
      }
    },

    drawOverlay: function(overlay, boxes) {
      // Pulisci overlay precedente
      overlay.innerHTML = '';
      
      if (boxes && boxes.length > 0) {
        // Crea box di rilevamento
        boxes.forEach(box => {
          const boxElement = document.createElement('div');
          boxElement.className = 'detection-box';
          boxElement.style.position = 'absolute';
          boxElement.style.border = '2px solid #00ff00';
          boxElement.style.pointerEvents = 'none';
          
          // Posiziona box (semplificato)
          const rect = overlay.getBoundingClientRect();
          boxElement.style.left = '50%';
          boxElement.style.top = '50%';
          boxElement.style.width = '200px';
          boxElement.style.height = '100px';
          boxElement.style.transform = 'translate(-50%, -50%)';
          
          overlay.appendChild(boxElement);
        });
      }
    },

    // Utility per test
    simulateDetection: function(code) {
      const event = new CustomEvent('barcodeDetected', {
        detail: { code: code, data: { codeResult: { code: code } } }
      });
      document.dispatchEvent(event);
    }
  };

  // Utility per debugging
  window.BarcodeScanner.debug = {
    logSupportedFormats: function() {
      console.log('Supported barcode formats:', [
        'Code 128',
        'EAN-13',
        'EAN-8', 
        'Code 39',
        'UPC-A',
        'UPC-E',
        'Codabar',
        'I2OF5'
      ]);
    },
    
    testCamera: function() {
      if (this.isSupported()) {
        console.log('Camera support: OK');
        return true;
      } else {
        console.log('Camera support: NOT AVAILABLE');
        return false;
      }
    }
  };

})();
