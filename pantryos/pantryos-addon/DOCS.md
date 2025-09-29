# Home Assistant Community Add-on: PantryOS (Node Edition)

PantryOS per Home Assistant ora è alimentato da un backend Node.js e da un frontend
React moderno. Offre un'unica dashboard per gestire dispensa, lista della spesa e
attività domestiche.

## Installazione

1. Apri **Impostazioni → Componenti aggiuntivi** in Home Assistant.
2. Aggiungi il repository `https://github.com/llingua/addon-pantryos` nello Store.
3. Installa l'add-on **PantryOS (Node Edition)**.
4. Avvia l'add-on e apri l'interfaccia tramite **OPEN WEB UI** (Ingress).

Non sono presenti credenziali di default: l'accesso avviene tramite Home
Assistant.

## Configurazione

Ricordati di riavviare l'add-on dopo ogni modifica al file di configurazione.

```yaml
culture: it
currency: EUR
timezone: Europe/Rome
demo_data: true
log_level: info
```

### Opzione: `culture`

Imposta la lingua e la localizzazione (formati data/numero) del frontend.
Valori ammessi: `ca`, `cs`, `da`, `de`, `el_GR`, `en`, `en_GB`, `es`, `et`,
`fi`, `fr`, `he_IL`, `hu`, `it`, `ja`, `ko_KR`, `lt`, `nl`, `no`, `pl`, `pt_BR`,
`pt_PT`, `ro`, `ru`, `sk_SK`, `sl`, `sv_SE`, `ta`, `tr`, `uk`, `zh_CN`, `zh_TW`.

### Opzione: `currency`

Valuta utilizzata per il valore stimato della dispensa (codice ISO4217).
Esempi: `EUR`, `USD`, `GBP`.

### Opzione: `timezone`

Timezone da utilizzare per il calcolo delle date delle attività. Se omessa viene
utilizzato `UTC`.

### Opzione: `demo_data`

- `true`: inizializza il file `/data/pantryos/state.json` con un dataset
  dimostrativo (scorte, lista della spesa e attività di esempio)
- `false`: crea un dataset vuoto

### Opzione: `log_level`

Livello di log del backend Node.js. Valori: `trace`, `debug`, `info`, `notice`,
`warning`, `error`, `fatal`. Il valore predefinito è `info`.

## Storage persistente

I dati dell'applicazione sono salvati in `/data/pantryos/state.json`. Puoi
eseguire backup o modifiche manuali a questo file per integrare PantryOS con altri
strumenti, facendo attenzione alla sintassi JSON.

## API

L'applicazione espone API RESTful sullo stesso dominio dell'interfaccia web.
Endpoint principali:

- `GET /api/state`: stato completo (dispensa, spesa, attività, configurazione)
- `POST /api/items`: aggiunge un prodotto alla dispensa
- `PATCH /api/items/<id>`: aggiorna un prodotto
- `DELETE /api/items/<id>`: rimuove un prodotto
- `POST /api/shopping-list`: aggiunge un elemento alla lista della spesa
- `PATCH /api/shopping-list/<id>`: aggiorna/completa un elemento
- `DELETE /api/shopping-list/<id>`: rimuove un elemento
- `POST /api/tasks`: crea una nuova attività
- `PATCH /api/tasks/<id>`: aggiorna o completa un'attività
- `DELETE /api/tasks/<id>`: elimina un'attività

Tutte le richieste devono essere inviate con header `Content-Type: application/json`.

## Supporto

Per assistenza, idee o bug report visita il
[repository GitHub del progetto](https://github.com/llingua/addon-pantryos) o
partecipa ai canali community indicati nel README.
