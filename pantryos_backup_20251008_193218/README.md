# PantryOS

[![GitHub Release][releases-shield]][releases]
![Project Stage][project-stage-shield]
[![License][license-shield]](LICENSE.md)

**🔁 REFRESHED ARCHITECTURE** – PantryOS è stato progettato interamente con **Node.js** e **React**.

## 🚀 Build e Rilascio

### Prerequisiti
- Git
- Node.js 18+
- Docker (per build multi-architettura)

### Build dell'Add-on

1. Clona il repository:
   ```bash
   git clone https://github.com/llingua/pantryos.git
   cd pantryos
   ```

2. Rendi eseguibile lo script di build:
   ```bash
   chmod +x build-addon.sh
   ```

3. Esegui lo script di build:
   ```bash
   ./build-addon.sh
   ```
   
   Questo genererà un file `.tar.gz` nella cartella `dist/`.

### Creazione di una Nuova Release

1. Aggiorna la versione in `pantryos/config.yaml`
2. Esegui lo script di build
3. Crea un nuovo tag Git:
   ```bash
   git tag -a v1.0.0 -m 'Release 1.0.0'
   git push origin v1.0.0
   ```
4. Crea una nuova release su GitHub e carica i file:
   - `dist/pantryos-{VERSION}.tar.gz`
   - `dist/pantryos-{VERSION}.tar.gz.sha256`
   - `dist/pantryos-{VERSION}.tar.gz.asc` (se firmato)

### Aggiunta della Repository a Home Assistant

1. Vai su **Impostazioni** > **Componenti aggiuntivi**
2. Clicca su **Repository** (in basso a destra)
3. Aggiungi: `https://github.com/llingua/pantryos`
4. Installa "PantryOS" dalla lista degli add-on disponibili

## About

PantryOS è una piattaforma autonoma per la gestione della dispensa:

- 🌐 **Frontend React** con grafica responsive e componenti moderni
- 🟢 **Backend Node.js** con API leggere basate su file JSON persistenti
- 🧊 **Storage persistente** in `/data/pantryos/state.json`, con possibilità di
  inizializzare dati demo o ambiente vuoto
- 🛡️ **Security headers** e protezioni contro richieste malformate già incluse

Perfetto per monitorare dispensa, lista della spesa e attività domestiche in
maniera semplice e visuale.

## ✨ Novità principali

- Interfaccia React single-page ottimizzata per Ingress
- API RESTful leggere in Node.js, senza dipendenze esterne
- Gestione di scorte, lista della spesa e attività in un unico dashboard
- Supporto alle impostazioni di cultura, valuta e timezone
- Dataset dimostrativo opzionale per partire subito

## 🔐 Sicurezza integrata

- Content Security Policy restrittiva con caricamento script da fonti note
- Header di sicurezza (HSTS, X-Frame-Options, Referrer-Policy, ecc.)
- Sanitizzazione delle richieste e limite dimensione payload
- Storage JSON con permessi restrittivi

# 🚀 Installazione

1. Clona il repository `https://github.com/llingua/pantryOS`
2. Installa le dipendenze Node.js (se previste)
3. Usa gli script di gestione per avviare il server
4. Accedi a `http://localhost:8080`

## 📋 Script di gestione

Il progetto include script di gestione per facilitare l'uso:

### 🚀 Avvio

```bash
./start.sh              # Avvio semplice (default)
./start.sh simple       # Avvio semplice (esplicito)
./start.sh complete     # Avvio completo con tutte le funzionalità
./start.sh help         # Mostra aiuto
```

### 🛑 Arresto

```bash
./stop.sh               # Ferma il server PantryOS
```

### 🔄 Riavvio

```bash
./restart.sh            # Riavvia in modalità semplice (default)
./restart.sh simple     # Riavvia in modalità semplice
./restart.sh complete   # Riavvia in modalità completa
./restart.sh help       # Mostra aiuto
```

### 🎯 Modalità disponibili

- **Semplice**: Server standalone con funzionalità base
- **Completa**: Tutte le funzionalità API (locations, products, shopping list, tasks, etc.)

## 🔧 Configurazione

Esempio di configurazione:

```yaml
culture: it
currency: EUR
timezone: Europe/Rome
demo_data: true
log_level: info
```

- `culture`: lingua dell'interfaccia e formattazione date
- `currency`: valuta utilizzata per i totali stimati
- `timezone`: timezone utilizzata per date ed orari (opzionale)
- `demo_data`: inizializza l'istanza con dati dimostrativi
- `log_level`: livello di log del backend Node.js (`info` di default)

Ricordati di riavviare l'add-on dopo ogni modifica.

## 🗂️ Struttura del progetto

```
pantryos/
├── app/
│   ├── public/        # Frontend React distribuito come asset statico
│   ├── server/        # Backend Node.js con API e static serving
│   └── data/          # Dataset demo e stato vuoto
└── rootfs/
    └── etc/s6-overlay # Script di avvio e preparazione storage
```

I dati persistenti vengono salvati in `/data/pantryos/state.json`.

## Supporto

Per segnalazioni e proposte apri una issue nel repository GitHub ufficiale di PantryOS.

## Autori e contributori

PantryOS è un progetto indipendente creato da **Lorenzo Lingua** (lorenzo.lingua@gmail.com).
Contributi esterni sono benvenuti tramite pull request.

## Licenza

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
