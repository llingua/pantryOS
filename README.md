# PantryOS

PantryOS e un addon per Home Assistant con frontend statico e backend Node.js. Questo repository ora tratta l'addon come target principale, ma mantiene un flusso di sviluppo locale rapido per evitare rebuild completi a ogni modifica.

## Struttura canonica

```text
pantryOS/
├── pantryos/
│   ├── app/                  # Codice applicativo vero
│   │   ├── public/           # Frontend statico
│   │   ├── server/           # Backend Node.js
│   │   └── data/             # Seed e schema applicativo
│   ├── config.yaml           # Manifest addon Home Assistant
│   ├── build.yaml            # Build metadata addon
│   ├── Dockerfile            # Runtime addon
│   └── rootfs/               # Init e servizio s6
├── scripts/                  # Tool di supporto e test manuali
├── docs/                     # Documentazione di sviluppo e note AI
├── data/pantryos/            # Stato locale per sviluppo
├── dist/                     # Artefatti build addon
└── archive/                  # Materiale storico e backup
```

## Flussi ufficiali

### Sviluppo locale veloce

Usa lo stesso server canonico dell'addon, ma con dati locali:

```bash
npm run dev
```

Il server parte su `http://localhost:3000` e scrive i log in `logs/dev-server.log`.

### Stop e restart

```bash
npm run stop
npm run restart
```

### Build addon

```bash
npm run addon:build
```

## Fonte di verita

- Entry point applicativo canonico: `pantryos/app/server/pantryos-server.js`
- Porta interna addon: `8099`
- Healthcheck addon: `/api/health`
- Dati persistenti addon: `/data/pantryos`
- UI corrente consigliata: HTTP interno sulla porta 8099 dietro reverse proxy HTTPS

## Note organizzative

- I file che citano `pantryos-addon` sono da considerare legacy.
- La modalita standalone non e piu un secondo prodotto: e solo un dev loop rapido.
- Le verifiche finali di compatibilita restano da fare dentro Home Assistant.
- Gli script dentro `scripts/dev/` sono supporto locale e non flusso ufficiale di rilascio.
- I test HTML e i server HTTPS locali sono raccolti in `scripts/testing/manual/`.

## Prossimi passi consigliati

1. Ridurre ancora il numero di script legacy dentro `scripts/dev/`.
2. Far convergere i test manuali principali su uno o due flussi davvero usati.
3. Aggiungere controlli CI piu ricchi su CRUD e build addon.
4. Verificare il workflow completo dentro Home Assistant dopo ogni riallineamento strutturale.
