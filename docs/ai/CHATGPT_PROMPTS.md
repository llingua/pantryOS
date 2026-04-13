# PantryOS - ChatGPT Prompts

# =========================

## Come usare ChatGPT con PantryOS

### 1. Prompt di contesto iniziale

```
Sono uno sviluppatore che lavora su PantryOS, un sistema di gestione dispensa basato su Node.js e React.

Il progetto ha questa struttura:
- Backend: Node.js con server HTTP vanilla (no Express)
- Frontend: React in vanilla JS (no build process)
- Storage: file JSON persistenti
- Scripts: start.sh, stop.sh, restart.sh per gestione

I file principali sono:
- pantryos/pantryos-addon/app/server/server.js (backend)
- pantryos/pantryos-addon/app/public/app.js (frontend React)
- pantryos/pantryos-addon/app/public/index.html (entry point)

L'API ha endpoint per:
- /api/health, /api/state, /api/items, /api/shopping-list, /api/tasks

Quando mi aiuti con il codice, mantieni questa architettura e usa gli stessi pattern esistenti.
```

### 2. Prompt per debugging

```
Ho un problema con PantryOS. Il server si avvia ma l'interfaccia non carica correttamente.

Il server è in pantryos/pantryos-addon/app/server/server.js e usa un server HTTP vanilla.
Il frontend è in pantryos/pantryos-addon/app/public/app.js ed è React vanilla.

Puoi aiutarmi a identificare il problema?
```

### 3. Prompt per nuove funzionalità

```
Voglio aggiungere una nuova funzionalità a PantryOS: [DESCRIVI LA FUNZIONALITÀ]

Il backend è in pantryos/pantryos-addon/app/server/server.js e usa pattern come:
- handleApi() per gestire le richieste API
- sendJson() per risposte JSON
- mutateState() per modificare lo stato
- sanitizeNumber() per validazione input

Il frontend è in pantryos/pantryos-addon/app/public/app.js ed usa React con:
- useState per stato locale
- useEffect per effetti
- fetchJson() per chiamate API
- h() per creare elementi React

Puoi suggerirmi come implementare questa funzionalità mantenendo gli stessi pattern?
```

### 4. Prompt per refactoring

```
Voglio migliorare il codice di PantryOS. Puoi analizzare il file [NOME_FILE] e suggerire miglioramenti per:
- Performance
- Leggibilità
- Manutenibilità
- Sicurezza

Mantieni l'architettura esistente (Node.js vanilla + React vanilla).
```

### 5. Prompt per testing

```
Voglio aggiungere test per PantryOS. Il progetto usa:
- Node.js vanilla per il backend
- React vanilla per il frontend
- File JSON per storage

Puoi suggerirmi come implementare test unitari e di integrazione?
```

### 6. Prompt per deployment

```
Voglio deployare PantryOS in produzione. Il progetto ha:
- Scripts start.sh, stop.sh, restart.sh
- Configurazione Docker in rootfs/
- Integrazione Home Assistant in ha-config/

Puoi suggerirmi una strategia di deployment?
```

## Esempi di conversazione con ChatGPT

### Esempio 1: Aggiungere nuova API

```
Utente: "Voglio aggiungere un endpoint /api/categories per gestire le categorie di prodotti in PantryOS"

ChatGPT: "Perfetto! Basandomi sulla struttura esistente di PantryOS, ecco come implementare l'endpoint /api/categories..."

[ChatGPT fornirà codice basato sui pattern esistenti]
```

### Esempio 2: Debugging

```
Utente: "L'interfaccia React non si aggiorna dopo aver aggiunto un nuovo item"

ChatGPT: "Analizziamo il problema. Nel file app.js, la funzione loadState() dovrebbe essere chiamata dopo ogni operazione. Verifica che..."

[ChatGPT analizzerà il codice e suggerirà soluzioni]
```

### Esempio 3: Miglioramenti

```
Utente: "Come posso migliorare le performance del server PantryOS?"

ChatGPT: "Ecco alcune ottimizzazioni per il tuo server Node.js vanilla..."

[ChatGPT suggerirà miglioramenti specifici per l'architettura esistente]
```

## Tips per ChatGPT

1. **Sii specifico**: Menziona sempre i file e le funzioni specifiche
2. **Mantieni il contesto**: Ricorda sempre l'architettura (Node.js vanilla + React vanilla)
3. **Usa esempi**: Fornisci esempi di codice esistente quando possibile
4. **Chiedi spiegazioni**: Se non capisci, chiedi di spiegare passo per passo
5. **Testa le soluzioni**: Chiedi come testare le modifiche suggerite
