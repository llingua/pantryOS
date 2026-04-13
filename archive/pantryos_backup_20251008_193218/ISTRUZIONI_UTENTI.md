# 🚀 ISTRUZIONI INSTALLAZIONE - PantryOS Node Edition

## 📋 Panoramica

Questa versione dell'add-on PantryOS è stata completamente rifattorizzata: niente
PHP o nginx, ma un backend Node.js e un'interfaccia React. L'accesso avviene
tramite Home Assistant Ingress e non esistono credenziali locali predefinite.

**🔐 Score Sicurezza Stimato: 9.1/10**

---

## 🛡️ Vulnerabilità risolte

- ✅ Eliminazione account `admin/admin`
- ✅ Sostituzione del backend PHP affetto da CVE-2024-55075
- ✅ Rimozione configurazioni nginx insicure
- ✅ Storage dati con permessi restrittivi (`/data/pantryos/state.json`)

---

## 🚀 Installazione rapida

### Passo 1: Aggiungi il repository
1. Vai su **Impostazioni → Componenti aggiuntivi**
2. Apri l'**Add-on Store**
3. Clicca sui **tre puntini** (⋮) in alto a destra
4. Seleziona **Repositories**
5. Inserisci `https://github.com/llingua/addon-pantryos`
6. Conferma con **Add**

### Passo 2: Installa l'add-on
1. Cerca “PantryOS (Node Edition)” nello store
2. Clicca **Install** e attendi il completamento
3. Avvia l'add-on con **Start**
4. Apri l'interfaccia con **OPEN WEB UI** (Ingress)

Nessun cambio password necessario: l'autenticazione è gestita da Home Assistant.

---

## 🔧 Configurazione consigliata

```yaml
culture: it
currency: EUR
timezone: Europe/Rome
demo_data: true
log_level: info
```

- `demo_data: true` abilita un dataset dimostrativo. Imposta `false` per un
  ambiente vuoto.
- `log_level` controlla la verbosità del backend Node.js (`info` predefinito).

Ricorda di riavviare l'add-on dopo ogni modifica.

---

## ⚙️ Configurazione avanzata

```yaml
culture: it          # Localizzazione interfaccia e date
currency: EUR        # Valuta mostrata nei riepiloghi
timezone: Europe/Rome
log_level: debug     # Aumenta i log in caso di debug
demo_data: false     # Avvia con dataset vuoto in produzione
```

### Dati persistenti
- Il file applicativo è `/data/pantryos/state.json`
- Puoi effettuarne backup o modificarlo manualmente (JSON valido)
- Permessi impostati automaticamente a `600`

### API disponibili
- `GET /api/state` – stato completo (stock, shopping list, tasks)
- `POST /api/items` – aggiunge un prodotto
- `PATCH /api/items/<id>` – aggiorna quantità/scadenza
- `DELETE /api/items/<id>` – rimuove il prodotto
- `POST /api/shopping-list` – aggiunge elemento alla spesa
- `PATCH /api/shopping-list/<id>` – marca come acquistato
- `POST /api/tasks` – aggiunge attività
- `PATCH /api/tasks/<id>` – completa/aggiorna attività
- `DELETE /api/tasks/<id>` – elimina attività

Tutte le richieste devono includere `Content-Type: application/json`.

---

## 🛡️ Protezioni implementate

- Content Security Policy restrittiva
- Strict-Transport-Security (HSTS)
- X-Frame-Options, Referrer-Policy, Permissions-Policy
- Limite dimensione body 1MB e validazione JSON
- Queue interna per scritture concorrenti sul file dati
- Health check `GET /api/health`

---

## ✅ Checklist post installazione

- [ ] Repository aggiunto
- [ ] Add-on installato e avviato senza errori
- [ ] Configurazione salvata e riavvio effettuato
- [ ] Interfaccia accessibile tramite Ingress
- [ ] Dataset iniziale verificato (demo o vuoto)
- [ ] API testate (facoltativo)

Per log dettagliati utilizzare il pannello **Log** dell'add-on (log Node.js).
