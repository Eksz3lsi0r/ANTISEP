# 🚀 Quick Start Guide - Version 2.0

## In 5 Minuten zur Echtzeit-Übersetzung!

### Schritt 1: Repository klonen (falls noch nicht geschehen)

```bash
git clone https://github.com/Eksz3lsi0r/ANTISEP.git
cd ANTISEP/translator-app
```

### Schritt 2: Dependencies installieren

```bash
# Server
cd server
npm install axios  # Neue Dependency für v2
cd ..

# Client
cd client
npm install
cd ..
```

### Schritt 3: Umgebungsvariablen konfigurieren

```bash
cd server
cp .env.example .env
nano .env  # oder vim, code, etc.
```

**Minimale Konfiguration (nur OpenAI):**
```env
OPENAI_API_KEY=sk-your-openai-key-here
PORT=3001
```

**Budget-Optimiert (empfohlen):**
```env
OPENAI_API_KEY=sk-your-openai-key-here
ASSEMBLYAI_API_KEY=your-assemblyai-key-here
UNREAL_SPEECH_API_KEY=your-unreal-speech-key-here
PORT=3001
```

### Schritt 4: Version 2.0 aktivieren

```bash
# Im server-Verzeichnis
mv index.js index-v1.js
cp index-v2.js index.js

# Im client-Verzeichnis
cd ../client/src

# Socket Service
mv services/socket.js services/socket-v1.js
cp services/socket-v2.js services/socket.js

# Audio Recorder
mv hooks/useAudioRecorder.js hooks/useAudioRecorder-v1.js
cp hooks/useAudioRecorder-v2.js hooks/useAudioRecorder.js

# Zurück zum Hauptverzeichnis
cd ../..
```

### Schritt 5: App starten

```bash
# Im translator-app Verzeichnis
./start.sh
```

**Oder manuell:**

```bash
# Terminal 1: Server
cd server
node index.js

# Terminal 2: Client
cd client
npm run dev
```

### Schritt 6: App öffnen

Öffne deinen Browser:
- **Client:** http://localhost:5173
- **Server Health:** http://localhost:3001/health

## 🎯 Erste Schritte in der App

### User 1 (Erstellt Raum)
1. Wähle deine Sprache (z.B. "German")
2. Klicke auf "Neuer Raum"
3. Notiere die Raum-ID (z.B. "ABC123")
4. Teile die Raum-ID mit deinem Gesprächspartner

### User 2 (Tritt Raum bei)
1. Wähle deine Sprache (z.B. "English")
2. Gib die Raum-ID ein (z.B. "ABC123")
3. Klicke auf "Raum beitreten"

### Gespräch starten
1. Klicke auf das Mikrofon-Symbol
2. Erlaube Mikrofon-Zugriff (beim ersten Mal)
3. Sprich in deine Sprache
4. Höre die Übersetzung in der anderen Sprache!

## 🔑 API-Keys erhalten

### OpenAI (erforderlich)
1. Gehe zu https://platform.openai.com/api-keys
2. Erstelle einen Account (falls noch nicht vorhanden)
3. Klicke auf "Create new secret key"
4. Kopiere den Key und füge ihn in `.env` ein

**Kosten:** Pay-as-you-go, ~$0.41 pro 10-Min-Gespräch

### AssemblyAI (optional, empfohlen)
1. Gehe zu https://www.assemblyai.com/
2. Erstelle einen kostenlosen Account
3. Kopiere deinen API-Key aus dem Dashboard
4. Füge ihn in `.env` ein

**Kosten:** 3 Stunden/Monat kostenlos, dann $0.00025/min

### Unreal Speech (optional, empfohlen)
1. Gehe zu https://unrealspeech.com/
2. Erstelle einen Account
3. Kopiere deinen API-Key
4. Füge ihn in `.env` ein

**Kosten:** 1 Million Zeichen/Monat kostenlos, dann $0.0006/1k chars

## 💰 Kostenvergleich

| Setup | Kosten (10 Min) | Kosten (Monat)* |
|-------|-----------------|-----------------|
| Nur OpenAI | $0.41 | $205 |
| Budget-Optimiert | $0.0285 | $14.25 |
| **Ersparnis** | **93%** | **$190.75** |

*100 User, 5 Calls/Monat, 10 Min pro Call

## 🐛 Troubleshooting

### "Socket not connected"
**Lösung:** Warte 5 Sekunden oder klicke auf "Retry"

### "Microphone access denied"
**Lösung:** 
1. Klicke auf das Schloss-Symbol in der Adressleiste
2. Erlaube Mikrofon-Zugriff
3. Lade die Seite neu (F5)

### "Rate limit exceeded"
**Lösung:** Warte 1 Minute - du sprichst zu schnell!

### Server startet nicht
**Lösung:** 
```bash
# Prüfe ob Port 3001 bereits belegt ist
lsof -i :3001

# Oder nutze einen anderen Port
PORT=3002 node index.js
```

### Client startet nicht
**Lösung:**
```bash
# Prüfe ob Port 5173 bereits belegt ist
lsof -i :5173

# Oder nutze einen anderen Port
npm run dev -- --port 5174
```

## 📊 Features testen

### Health Check
```bash
curl http://localhost:3001/health
```

### Statistiken
```bash
curl http://localhost:3001/stats
```

### Connection Status
Schaue in die obere rechte Ecke der App - du siehst:
- ✅ Grün = Verbunden
- 🔄 Gelb = Reconnecting
- ❌ Rot = Disconnected

### Error Notifications
Fehler werden automatisch als Toast-Benachrichtigungen angezeigt (oben rechts)

## 🎓 Tipps für beste Ergebnisse

1. **Nutze ein gutes Mikrofon** - bessere Audio-Qualität = bessere Übersetzung
2. **Sprich deutlich** - nicht zu schnell, nicht zu leise
3. **Reduziere Hintergrundgeräusche** - nutze Kopfhörer wenn möglich
4. **Stabile Internetverbindung** - mindestens 256 kbps
5. **Moderne Browser** - Chrome/Edge empfohlen

## 🚀 Nächste Schritte

1. ✅ **Teste die App** mit einem Freund
2. ✅ **Registriere Budget-APIs** für Kostenersparnis
3. ✅ **Lies die Dokumentation** für erweiterte Features
4. ✅ **Gib Feedback** auf GitHub

## 📚 Weitere Dokumentation

- **Upgrade-Guide:** `UPGRADE_GUIDE_V2.md`
- **Architektur:** `ARCHITECTURE_V2.md`
- **Original Docs:** `README.md`, `PROJECT_COMPLETE.md`

## 🆘 Hilfe benötigt?

1. Prüfe die Logs im Browser (F12 → Console)
2. Prüfe die Server-Logs im Terminal
3. Teste den Health Endpoint
4. Erstelle ein GitHub Issue mit Details

---

**Viel Spaß beim Vereinen der Menschheit! 🌍✨**
