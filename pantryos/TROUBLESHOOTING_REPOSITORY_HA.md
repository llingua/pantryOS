# 🔧 TROUBLESHOOTING REPOSITORY HOME ASSISTANT

## 🚨 **PROBLEMA: "Non è un repository valido"**

Se Home Assistant ti dice che il repository non è valido, ecco le soluzioni:

---

## ✅ **SOLUZIONI IMMEDIATE**

### **1. Verifica URL Corretto**

```
✅ CORRETTO: https://github.com/llingua/addon-pantryos
❌ SBAGLIATO: https://github.com/llingua/addon-pantryos.git
❌ SBAGLIATO: https://github.com/llingua/addon-pantryos/
```

### **2. Attendi Propagazione GitHub**

- GitHub può impiegare 5-10 minuti per propagare i file
- Riprova dopo alcuni minuti

### **3. Riavvia Home Assistant**

```bash
# Via SSH
ha core restart

# Oppure riavvia completamente
ha host reboot
```

---

## 🔍 **VERIFICA STRUTTURA REPOSITORY**

### **File Richiesti**

```
addon-pantryos/
├── repository.json          # ✅ Aggiunto
├── pantryos/
│   ├── config.yaml          # ✅ Corretto
│   ├── Dockerfile
│   └── rootfs/
└── README.md
```

### **Test Accessibilità**

```bash
# Test repository.json
curl https://raw.githubusercontent.com/llingua/addon-pantryos/main/repository.json

# Test config.yaml
curl https://raw.githubusercontent.com/llingua/addon-pantryos/main/pantryos/config.yaml
```

---

## 🛠️ **METODI ALTERNATIVI**

### **Metodo 1: Via SSH**

```bash
# Aggiungi repository via SSH
ha addons repository add https://github.com/llingua/addon-pantryos

# Verifica repository
ha addons repository list
```

### **Metodo 2: Via configuration.yaml**

```yaml
# Aggiungi a configuration.yaml
addons:
  - name: 'PantryOS Secure'
    url: 'https://github.com/llingua/addon-pantryos'
```

### **Metodo 3: Download Manuale**

1. Scarica il repository
2. Copia in `/config/addons/`
3. Riavvia Home Assistant

---

## 🔧 **CORREZIONI APPLICATE**

### **✅ Problemi Risolti**

1. **URL corretto** in `config.yaml`
2. **repository.json** aggiunto
3. **Struttura conforme** ai requisiti HA

### **📋 Checklist Verifica**

- [ ] URL repository corretto
- [ ] File `repository.json` presente
- [ ] File `pantryos/config.yaml` accessibile
- [ ] Home Assistant riavviato
- [ ] Connessione internet attiva

---

## 🆘 **SE IL PROBLEMA PERSISTE**

### **1. Controlla Log Home Assistant**

```bash
# Log supervisor
ha supervisor logs

# Log core
ha core logs
```

### **2. Test Connessione**

```bash
# Test ping GitHub
ping github.com

# Test DNS
nslookup github.com
```

### **3. Cache Browser**

- Pulisci cache browser
- Riavvia browser
- Prova browser diverso

### **4. Firewall/Proxy**

- Verifica firewall
- Controlla proxy
- Testa connessione diretta

---

## 📞 **SUPPORTO AGGIUNTIVO**

### **Community Home Assistant**

- [Forum HA](https://community.home-assistant.io/)
- [Discord HA](https://discord.gg/c5DvZ4e)

### **Documentazione Ufficiale**

- [HA Add-ons](https://www.home-assistant.io/addons/)
- [HA Repository](https://www.home-assistant.io/hassio/installing_third_party_addons/)

---

## 🎯 **STATO ATTUALE**

### **✅ Repository Configurato**

- URL: `https://github.com/llingua/addon-pantryos`
- Struttura: Conforme HA
- File: Tutti presenti

### **🔄 Prossimi Passi**

1. Attendi propagazione GitHub (5-10 min)
2. Riavvia Home Assistant
3. Riprova ad aggiungere repository
4. Se necessario, usa metodi alternativi

---

**Il repository è ora configurato correttamente per Home Assistant!** 🎉

_Ultimo aggiornamento: 2025-09-26_
