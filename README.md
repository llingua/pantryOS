# PantryOS

[![GitHub Release][releases-shield]][releases]
![Project Stage][project-stage-shield]
[![License][license-shield]](LICENSE.md)
[![Node.js Version][node-version-shield]][node-version]
[![Dependencies Status][dependencies-shield]][dependencies-url]

**🚀 MODERN ARCHITECTURE** – PantryOS è un'applicazione web moderna per la gestione della dispensa, costruita con **Node.js** e **React**.

## 📋 Panoramica

PantryOS è una piattaforma completa per la gestione della dispensa domestica, con le seguenti caratteristiche:

- 🌐 **Frontend React** con interfaccia utente reattiva e moderna
- 🟢 **Backend Node.js** ad alte prestazioni con API RESTful
- 📊 **Logging avanzato** con rotazione dei file e diversi livelli di log
- 🔒 **Sicurezza rafforzata** con rate limiting, CORS e protezioni varie
- 🧩 **Architettura modulare** per una facile manutenzione ed estensione

## ✨ Funzionalità principali

- ✅ Gestione completa della dispensa con categorie personalizzabili
- 🛒 Lista della spesa integrata
- 📊 Statistiche e report sui consumi
- 🌍 Supporto multilingua e multi-valuta
- ⚡ Ottimizzato per le prestazioni con compressione e caching
- 🛡️ Sicurezza avanzata con validazione degli input e protezione da attacchi comuni

## 🚀 Installazione rapida

1. Clona il repository:
   ```bash
   git clone https://github.com/llingua/pantryOS.git
   cd pantryOS
   ```

2. Copia il file di configurazione di esempio:
   ```bash
   cp .env.example .env
   ```

3. Installa le dipendenze:
   ```bash
   npm install
   ```

4. Avvia il server in modalità sviluppo:
   ```bash
   npm run dev
   ```

5. Apri il browser all'indirizzo: [http://localhost:3000](http://localhost:3000)

## 🛠️ Configurazione

Tutte le impostazioni possono essere configurate tramite variabili d'ambiente. Copia il file `.env.example` in `.env` e modifica le impostazioni secondo necessità.

### Variabili d'ambiente principali

- `NODE_ENV`: Ambiente di esecuzione (`development`, `production`)
- `APP_PORT`: Porta su cui gira il server (default: `3000`)
- `APP_HOST`: Indirizzo di ascolto (default: `0.0.0.0`)
- `APP_DATA_FILE`: Percorso del file di dati (default: `./data/state.json`)
- `APP_CULTURE`: Lingua predefinita (default: `it`)
- `APP_CURRENCY`: Valuta predefinita (default: `EUR`)
- `APP_TIMEZONE`: Fuso orario (default: `Europe/Rome`)
- `LOG_LEVEL`: Livello di log (`error`, `warn`, `info`, `debug`)

## 🚀 Script disponibili

- `npm start`: Avvia il server in produzione
- `npm run dev`: Avvia il server in modalità sviluppo con hot-reload
- `npm test`: Esegue i test (da implementare)
- `npm run lint`: Esegue il linter sul codice
- `npm run format`: Formatta automaticamente il codice

## 🔒 Sicurezza

PantryOS include diverse funzionalità di sicurezza integrate:

- **Rate Limiting**: Protezione contro attacchi di forza bruta
- **CORS**: Controllo degli accessi cross-origin
- **Security Headers**: Headers di sicurezza HTTP
- **Validazione input**: Sanificazione di tutti gli input utente
- **Logging**: Tracciamento dettagliato delle attività

## 📚 Documentazione

La documentazione completa è disponibile nella cartella `/docs`.

## 🤝 Contributi

I contributi sono ben accetti! Per favore leggi le linee guida per i contributi prima di inviare una pull request.

## 📄 Licenza

Questo progetto è rilasciato sotto la licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## 👨‍💻 Sviluppo

### Struttura del progetto

```
pantryOS/
├── pantryos/                 # Cartella principale dell'addon
│   ├── app/                  # Codice sorgente
│   │   ├── public/           # File statici
│   │   └── server/           # Codice del server Node.js
│   │       ├── middleware/   # Middleware personalizzati
│   │       └── utils/        # Utilità e helper
│   └── config.yaml           # Configurazione dell'addon
├── .env.example             # File di esempio per le variabili d'ambiente
└── package.json             # Dipendenze e script
```

### Convenzioni di codice

- Usa `async/await` invece di promise con `.then()`
- Segui lo stile di codice definito in `.eslintrc`
- Documenta le funzioni con JSDoc
- Scrivi test per le nuove funzionalità

## 📞 Supporto

Per problemi o domande, apri una issue su GitHub.

---

Sviluppato con ❤️ da [llingua](https://github.com/llingua)

## 🚀 Script di avvio

### Avvio

```bash
./start.sh              # Avvio semplice (default)
./start.sh simple       # Avvio semplice (esplicito)
./start.sh complete     # Avvio completo con tutte le funzionalità
./start.sh help         # Mostra aiuto
```

### Arresto

```bash
./stop.sh               # Ferma il server PantryOS
```

### Riavvio

```bash
./restart.sh            # Riavvia in modalità semplice (default)
./restart.sh simple     # Riavvia in modalità semplice
./restart.sh complete   # Riavvia in modalità completa
```

## 🔧 Configurazione avanzata

### Configurazione tramite file

Puoi configurare PantryOS modificando il file `pantryos/config.yaml`:

```yaml
culture: it
currency: EUR
timezone: Europe/Rome
demo_data: true
log_level: info
```

### Opzioni di configurazione

- `culture`: Lingua dell'interfaccia (es. `it`, `en`, `es`, `fr`)
- `currency`: Valuta predefinita (es. `EUR`, `USD`, `GBP`)
- `timezone`: Fuso orario (es. `Europe/Rome`, `America/New_York`)
- `demo_data`: Se `true`, carica dati dimostrativi all'avvio
- `log_level`: Livello di log (`error`, `warn`, `info`, `debug`)

## 🗂️ Struttura dei dati

I dati dell'applicazione vengono salvati in formato JSON nel file specificato dalla variabile d'ambiente `APP_DATA_FILE` (default: `./data/state.json`).

## 📄 Licenza

MIT License

Copyright (c) 2025 Lorenzo Lingua

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[releases-shield]: https://img.shields.io/github/release/llingua/pantryOS.svg
[releases]: https://github.com/llingua/pantryOS/releases
[project-stage-shield]: https://img.shields.io/badge/project%20stage-experimental-orange.svg
[license-shield]: https://img.shields.io/github/license/llingua/pantryOS.svg
[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[github-actions-shield]: https://github.com/llingua/pantryOS/workflows/CI/badge.svg
[github-actions]: https://github.com/llingua/pantryOS/actions
[maintenance-shield]: https://img.shields.io/maintenance/yes/2025.svg
[commits-shield]: https://img.shields.io/github/commit-activity/y/llingua/pantryOS.svg
[commits]: https://github.com/llingua/pantryOS/commits/main
[forum]: https://community.home-assistant.io/?u=addon_pantryos
[issue]: https://github.com/llingua/pantryOS/issues
[reddit]: https://www.reddit.com/r/homeassistant
[contributors]: https://github.com/llingua/pantryOS/graphs/contributors
