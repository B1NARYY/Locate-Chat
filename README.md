
---

```markdown
# Locate & Chat

**Locate & Chat** je jednoduchá real-time webová chatovací aplikace s podporou sdílení polohy. Uživatelé se mohou připojovat do veřejných i soukromých místností, posílat zprávy, sdílet svou aktuální polohu a komunikovat přes mapové rozhraní.

## ✨ Funkce

- ✅ Registrace a přihlášení uživatelů
- ✅ Tvorba veřejných i soukromých chatovacích místností
- ✅ Připojení pomocí unikátního kódu
- ✅ Realtime chat přes WebSocket
- ✅ Sdílení aktuální polohy na mapě (Leaflet + OpenStreetMap)
- ✅ Automatické přeposílání polohy (Auto-share)
- ✅ Odstranění místností vlastníkem
- ✅ Stylový a responzivní design

## 🛠 Použité technologie

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js (Express)
- **Realtime komunikace**: WebSocket (ws)
- **Databáze**: MySQL
- **Mapy**: Leaflet.js + OpenStreetMap
- **Autentizace**: šifrování hesel pomocí `crypto` (Fernet-like)

## 📁 Struktura projektu

```
/public            # Frontend (HTML, JS, CSS, logo, mapy, ...)
/routes            # Express routery (auth, chatroom, messages)
/services          # Databázové služby, logika
server.js          # Hlavní backend server
```

## 🚀 Lokální spuštění

1. Klonuj repozitář:

```bash
git clone https://github.com/tvoje-uzivatelske-jmeno/locate-and-chat.git
cd locate-and-chat
```

2. Nainstaluj závislosti:

```bash
npm install
```

3. Spusť server:

```bash
node server.js
```

4. Otevři aplikaci v prohlížeči:
```
http://localhost:3000
```

## 🌐 Nasazení (SPŠE JEČNÁ)

```bash
ssh -p 20280 jouda@dev.spsejecna.net
# git clone ...
# cd projekt
# npm install
# node server.js
```

Proxy:
```
http://s-holy-24-tp.dev.spsejecna.net → http://s-holy-24-tp:8080
```

## 🧪 TODO / Možnosti vylepšení

- [ ] Ověření e-mailu nebo silnější autentizace
- [ ] Přímé zprávy (private chat)
- [ ] Přidání historie zpráv
- [ ] Notifikace pro nové zprávy
- [ ] PWA verze (instalovatelná aplikace)

---

Autor: Holý Matěj
```

---