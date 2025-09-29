# PantryOS (Node Edition)

[![GitHub Release][releases-shield]][releases]
![Project Stage][project-stage-shield]
[![License][license-shield]](LICENSE.md)

**🔁 REFRESHED ARCHITECTURE** – PantryOS è stato progettato interamente con **Node.js** e **React**.

![PantryOS screenshot](images/screenshot.gif)

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

1. Clona il repository `https://github.com/llingua/pantryos`
2. Installa le dipendenze Node.js (se previste)
3. Avvia il server `node pantryos-addon/app/server/server.js`
4. Accedi a `http://localhost:8080`

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

## Contribuire

Questo progetto è open-source e accoglie volentieri nuovi contributi! Consulta
le nostre [linee guida per contribuire](.github/CONTRIBUTING.md) per iniziare.

## Autori e contributori

## Autori e contributori

PantryOS è un progetto indipendente creato da PantryOS Team.
Contributi esterni sono benvenuti tramite pull request.

## Licenza

MIT License

Copyright (c) 2025 PantryOS

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

[releases-shield]: https://img.shields.io/github/release/llingua/addon-pantryos.svg
[releases]: https://github.com/llingua/addon-pantryos/releases
[project-stage-shield]: https://img.shields.io/badge/project%20stage-experimental-orange.svg
[license-shield]: https://img.shields.io/github/license/llingua/addon-pantryos.svg
[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[github-actions-shield]: https://github.com/llingua/addon-pantryos/workflows/CI/badge.svg
[github-actions]: https://github.com/llingua/addon-pantryos/actions
[maintenance-shield]: https://img.shields.io/maintenance/yes/2025.svg
[commits-shield]: https://img.shields.io/github/commit-activity/y/llingua/addon-pantryos.svg
[commits]: https://github.com/llingua/addon-pantryos/commits/main
[discord]: https://discord.gg/c5DvZ4e
[discord-ha]: https://discord.gg/home-assistant
[forum]: https://community.home-assistant.io/?u=addon_pantryos
[issue]: https://github.com/llingua/addon-pantryos/issues
[reddit]: https://www.reddit.com/r/homeassistant
[frenck]: https://github.com/frenck
[contributors]: https://github.com/llingua/addon-pantryos/graphs/contributors
