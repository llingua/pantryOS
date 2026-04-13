# 🏠 PantryOS - Simulazione Ambiente Produzione HA

Questo documento spiega come simulare perfettamente l'ambiente di produzione Home Assistant per testare PantryOS prima dell'installazione.

## 🎯 Obiettivo

Risolvere i problemi comuni tra ambiente locale e produzione HA identificando e simulando le differenze.

## 📋 Problemi Comuni Identificati

### 1. **Percorsi File**

- **Locale**: `./data/state.json`
- **HA**: `/data/pantryos/state.json`
- **Soluzione**: Usa `APP_DATA_FILE=/data/pantryos/state.json`

### 2. **Porte**

- **Locale**: `8080`
- **HA**: `8099` (ingress)
- **Soluzione**: Usa `APP_PORT=8099`

### 3. **Variabili Ambiente**

- **Locale**: `NODE_ENV=development`
- **HA**: `NODE_ENV=production`
- **Soluzione**: Usa `NODE_ENV=production`

### 4. **Docker**

- **Locale**: Build normale
- **HA**: s6-overlay, ingress, limitazioni risorse
- **Soluzione**: Usa Dockerfile HA con s6

### 5. **Logs**

- **Locale**: `console.log`
- **HA**: `/var/log`, gestione s6
- **Soluzione**: Sistema di logging strutturato

## 🚀 Script Disponibili

### 1. `scripts/dev/simulate-production.sh`

Simula l'ambiente di produzione HA completo.

```bash
# Avvia simulazione completa
./scripts/dev/simulate-production.sh start

# Solo PantryOS (senza HA Core)
./scripts/dev/simulate-production.sh start --pantryos-only

# Monitora logs
./scripts/dev/simulate-production.sh logs

# Test API
./scripts/dev/simulate-production.sh test

# Shell container
./scripts/dev/simulate-production.sh shell

# Stop simulazione
./scripts/dev/simulate-production.sh stop
```

### 2. `scripts/dev/debug-production-issues.sh`

Diagnostica problemi comuni tra locale e produzione.

```bash
# Diagnostica completa
./scripts/dev/debug-production-issues.sh full

# Solo configurazione
./scripts/dev/debug-production-issues.sh config

# Simula problemi comuni
./scripts/dev/debug-production-issues.sh issues

# Genera report
./scripts/dev/debug-production-issues.sh report

# Suggerimenti
./scripts/dev/debug-production-issues.sh suggestions
```

### 3. `scripts/dev/test-production-env.sh`

Testa l'ambiente di produzione con variabili specifiche HA.

```bash
# Tutti i test
./scripts/dev/test-production-env.sh all

# Test specifici
./scripts/dev/test-production-env.sh env      # Variabili d'ambiente
./scripts/dev/test-production-env.sh files    # File e directory
./scripts/dev/test-production-env.sh ha       # Configurazione HA
./scripts/dev/test-production-env.sh docker   # Docker
```

## 🐳 Configurazione Docker

### Docker Compose Produzione

Usa `docker-compose-production.yml` per simulare perfettamente HA:

```yaml
# Variabili d'ambiente identiche a HA
environment:
  - NODE_ENV=production
  - APP_HOST=0.0.0.0
  - APP_PORT=8099
  - APP_DATA_FILE=/data/pantryos/state.json
  - APP_PUBLIC_DIR=/opt/pantryos/public
  - APP_BASE_PATH=/
  - APP_CULTURE=it
  - APP_CURRENCY=EUR
  - APP_TIMEZONE=Europe/Rome
  - APP_LOG_LEVEL=info
```

### Limitazioni Risorse

Simula le limitazioni di HA:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## 🔧 Variabili d'Ambiente Critiche

### Per Simulazione HA

```bash
export NODE_ENV=production
export APP_HOST=0.0.0.0
export APP_PORT=8099
export APP_DATA_FILE=/data/pantryos/state.json
export APP_PUBLIC_DIR=/opt/pantryos/public
export APP_BASE_PATH=/
export APP_CULTURE=it
export APP_CURRENCY=EUR
export APP_TIMEZONE=Europe/Rome
export APP_LOG_LEVEL=info
```

### Variabili Specifiche HA

```bash
export SUPERVISOR_TOKEN=test-token
export SUPERVISOR_URL=http://supervisor:4357
export HASSIO_TOKEN=test-hassio-token
```

## 📊 Monitoraggio e Debug

### Logs

```bash
# Logs PantryOS
docker-compose logs -f pantryos-local

# Logs HA Core
docker-compose logs -f homeassistant

# Logs Supervisor
docker-compose logs -f supervisor
```

### Debug Avanzato

```bash
# Shell nel container
docker-compose exec pantryos-local sh

# Dentro il container:
ps aux | grep node
netstat -tlnp | grep 8099
curl -f http://localhost:8099/
```

### Test API

```bash
# Test endpoint principale
curl http://localhost:8080/

# Test endpoint dati
curl http://localhost:8080/api/state

# Test health check
curl http://localhost:8080/health
```

## 🎯 Workflow Raccomandato

### 1. **Preparazione**

```bash
# Esegui diagnostica
./scripts/dev/debug-production-issues.sh full

# Testa ambiente
./scripts/dev/test-production-env.sh all
```

### 2. **Simulazione**

```bash
# Avvia simulazione produzione
./scripts/dev/simulate-production.sh start

# Monitora logs
./scripts/dev/simulate-production.sh logs
```

### 3. **Test**

```bash
# Test API
./scripts/dev/simulate-production.sh test

# Debug se necessario
./scripts/dev/simulate-production.sh shell
```

### 4. **Risoluzione Problemi**

```bash
# Genera report
./scripts/dev/debug-production-issues.sh report

# Suggerimenti
./scripts/dev/debug-production-issues.sh suggestions
```

## 🔍 Troubleshooting

### Problema: Porta 8099 in uso

```bash
# Trova processo
lsof -i :8099

# Termina processo
kill -9 <PID>
```

### Problema: File di stato non scrivibile

```bash
# Verifica permessi
ls -la ./data/pantryos/state.json

# Corregge permessi
chmod 664 ./data/pantryos/state.json
```

### Problema: Container non si avvia

```bash
# Verifica logs
docker-compose logs pantryos-local

# Rebuild
docker-compose down
docker-compose up --build
```

### Problema: API non risponde

```bash
# Verifica health check
curl -f http://localhost:8080/

# Verifica porta interna
docker-compose exec pantryos-local netstat -tlnp | grep 8099
```

## 📈 Metriche e Performance

### Monitoraggio Risorse

```bash
# Uso memoria
docker stats pantryos-local

# Uso CPU
docker exec pantryos-local top

# Spazio disco
docker exec pantryos-local df -h
```

### Test Performance

```bash
# Test carico
ab -n 1000 -c 10 http://localhost:8080/

# Test memoria
docker exec pantryos-local free -h
```

## 🎉 Risultati Attesi

Dopo aver seguito questo workflow dovresti avere:

1. ✅ **Ambiente identico a HA**: Stesse variabili, percorsi, porte
2. ✅ **Problemi identificati**: Differenze tra locale e produzione
3. ✅ **Soluzioni testate**: Configurazioni verificate
4. ✅ **Deploy sicuro**: Pronto per installazione HA

## 📞 Supporto

Se incontri problemi:

1. Esegui `./scripts/dev/debug-production-issues.sh full`
2. Genera report con `./scripts/dev/debug-production-issues.sh report`
3. Controlla logs con `./scripts/dev/simulate-production.sh logs`
4. Usa debug avanzato con `./scripts/dev/simulate-production.sh shell`

---

**Nota**: Questo sistema di simulazione replica fedelmente l'ambiente HA per garantire che PantryOS funzioni correttamente in produzione.
