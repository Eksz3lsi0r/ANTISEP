# 🏗️ Architektur v2: Budget-optimiert & Latenz-reduziert

## Systemarchitektur (v2)

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Mikrofon │→ │  WebRTC  │→ │ Socket.io│              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                        ↓ WebSocket (Audio Chunks)
┌─────────────────────────────────────────────────────────┐
│                   Server (Node.js)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Audio Buffer → Parallel Processing                │   │
│  │  ├─ STT (AssemblyAI) ────────────┐               │   │
│  │  ├─ Translation (GPT-4.1-nano) ──┤→ Combined     │   │
│  │  └─ TTS (Unreal Speech) ─────────┘   Response    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        ↓ WebSocket (Translated Audio)
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Lautsprecher│←│ Audio   │←│ Socket.io│              │
│  └──────────┘  │ Player   │  └──────────┘              │
│                └──────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## API-Änderungen (Kostenoptimierung)

| Service | Alte API (v1) | Neue API (v2) | Kostenersparnis |
|---|---|---|---|
| **Speech-to-Text** | OpenAI Whisper | **AssemblyAI** | **-96%** |
| **Translation** | GPT-4 Turbo | **GPT-4.1-nano** | **-90%** |
| **Text-to-Speech** | OpenAI TTS | **Unreal Speech** | **-95%** |

## Verbesserungen bei Error-Handling & Performance

### 1. Robustes Error-Handling
- **Socket.io Reconnection:** Implementiert eine verbesserte Logik für automatische Wiederverbindungen.
- **API-Fallbacks:** Wenn eine Budget-API fehlschlägt, wird automatisch auf eine Fallback-API (z.B. OpenAI) umgeschaltet.
- **Timeouts:** Jede API-Anfrage hat ein 10-Sekunden-Timeout, um Endlosschleifen zu verhindern.
- **Audio-Validierung:** Eingehende Audiodaten werden auf Gültigkeit geprüft.

### 2. Latenz-Optimierung
- **Streaming STT:** AssemblyAI ermöglicht die Verarbeitung von Audiodaten in Echtzeit, während sie noch gestreamt werden.
- **Parallele Verarbeitung:** STT, Übersetzung und TTS werden gleichzeitig ausgeführt, um die Gesamtverzögerung zu minimieren.
- **Kleinere Audio-Chunks:** Senden von 500ms-Audio-Chunks anstelle von 1-Sekunden-Chunks.
- **Connection Pooling:** Wiederverwendung von HTTP-Verbindungen zu den APIs.

## Kostenanalyse (v2)

### 10-Minuten-Gespräch (2 Teilnehmer)

| Setup | Kosten pro Gespräch | Ersparnis |
|---|---|---|
| v1 (OpenAI) | $0.41 | - |
| **v2 (Budget-optimiert)** | **$0.0285** | **-93%** |

### Monatliche Kosten (100 User, 5 Calls/Monat, 10 Min)

| Setup | Kosten pro Monat |
|---|---|
| v1 (OpenAI) | $205.00 |
| **v2 (Budget-optimiert)** | **$14.25** |

## Implementierungsplan

### Phase 1: Integration der neuen APIs
1.  **AssemblyAI** für Speech-to-Text implementieren.
2.  **GPT-4.1-nano** für die Übersetzung nutzen (bereits verfügbar).
3.  **Unreal Speech** für Text-to-Speech integrieren.

### Phase 2: Error-Handling & Stabilität
1.  Implementierung der Reconnection-Logik für Socket.io.
2.  Einrichtung von API-Fallbacks.
3.  Hinzufügen von Timeouts und Audio-Validierung.

### Phase 3: Performance-Tuning
1.  Optimierung des Audio-Streamings.
2.  Implementierung eines Caching-Mechanismus für häufige Übersetzungen.
3.  Einführung von Rate-Limiting zum Schutz vor Missbrauch.

