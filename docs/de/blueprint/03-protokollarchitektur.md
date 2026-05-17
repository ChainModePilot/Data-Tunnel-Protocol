# Kapitel 3: Protokollarchitektur

## 3.1 Protokollschichtung

DTP verwendet ein geschichtetes Architekturdesign, von oben nach unten:

```
┌─────────────────────────────────────────────┐
│           Anwendungsschicht                  │
│   iFay / coFay / Personal Data Heap          │
│   Endgeräteanwendungen (Software / Hardware)  │
├─────────────────────────────────────────────┤
│           DTP-Protokollschicht                │
│   DTP_Master Engine / DTP_Slave Engine       │
│   ┌───────────────────────────────────────┐ │
│   │ Agreement Manager                      │ │
│   │ Frame Codec                            │ │
│   │ DAG Manager                            │ │
│   │ Encryption Module                      │ │
│   │ Session Manager                        │ │
│   │ Resume Manager                         │ │
│   └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│           Adapterschicht                     │
│   Transport_Adapter                          │
├─────────────────────────────────────────────┤
│           Transportschicht                   │
│   BLE / WebSocket / TCP / RTSP / ...         │
└─────────────────────────────────────────────┘
```

### Designprinzipien

- **Transportagnostik**: Durch die Transport_Adapter-Abstraktion wird die DTP-Kernlogik von spezifischen Transportprotokollen entkoppelt
- **Verhandlung zuerst**: Jede Datenübertragung muss auf gegenseitig ausgehandelten Agreements basieren — keine „nackte Übertragung"
- **Datensouveränität**: Der Master hat die endgültige Entscheidungsgewalt über Datenflüsse; der Slave ist der Datenproduzent oder -konsument
- **Ende-zu-Ende-Verschlüsselung**: Die Payload wird während der Übertragung verschlüsselt; die FayGer-Laufzeitumgebung kann nicht auf Klartext zugreifen
- **Kontexterhaltung**: Jedes Fragment trägt strukturierte Kontext-Metadaten, die sicherstellen, dass der Kontext bei der Datenerfassung nicht verloren geht
- **Wiederherstellbarkeit**: Sequenznummern-basierter Wiederaufnahme-Mechanismus unterstützt nahtlose Wiederherstellung nach Verbindungsunterbrechungen

## 3.2 Kernkomponenten

### DTP_Engine

Die zentrale Verarbeitungsengine des DTP-Protokolls, verfügbar in zwei Varianten:

- **DTP_Master**: Läuft auf der Fay-Seite; besitzt das Recht, Datenerfassung zu initiieren und Entscheidungen zur Dateneinspeisung zu treffen
- **DTP_Slave**: Läuft auf der Endgeräteseite; verantwortlich für Datenproduktion und Einspeisungsanfragen

Beide teilen grundlegende Fähigkeiten wie Frame-Codec, Verschlüsselung und DAG-Verwaltung, unterscheiden sich jedoch in Verhandlungsberechtigungen und Datenflussrichtung.

### Transport_Adapter

Die abstrakte Schnittstelle für zugrunde liegende Transportprotokolle. DTP_Engine kommuniziert über diese Schnittstelle mit spezifischen Transportprotokollen und erreicht damit Transportagnostik. Unterstützte Transportprotokolle umfassen BLE, WebSocket, TCP, RTSP und andere.

Wenn die zugrunde liegende Transportverbindung unterbrochen wird, meldet Transport_Adapter ein Verbindungszustandsänderungs-Ereignis an DTP_Engine, was die Sitzungssuspendierung und den Wiederaufnahmeprozess auslöst.

### Agreement Manager

Verwaltet den vollständigen Lebenszyklus von Agreements:

1. **Erstellung**: Initiiert eine Verhandlungsanfrage
2. **Verhandlung**: Verarbeitet Anfragen und Antworten
3. **Aktivierung**: Generiert eine Agreement_ID, sobald beide Parteien einen Konsens erreichen
4. **Dynamische Anpassung**: Ändert Agreement-Parameter während der Übertragung
5. **Beendigung**: Beendet ein Agreement über eine Stopp-Direktive

### Frame Codec

Verantwortlich für die Serialisierung (Kodierung in Binärformat) und Deserialisierung (Dekodierung aus Binärformat) von Logical_Frames sowie für die formatierte Ausgabe (Pretty Print). Stellt sicher, dass Frames korrekt über verschiedene Plattformen übertragen werden.

### DAG Manager

Verwaltet gerichtete azyklische Graph-Abhängigkeitsbeziehungen zwischen Fragments:

- Zykluserkennung: Verhindert die Bildung zirkulärer Abhängigkeiten
- Abhängigkeitsauflösung: Behandelt Fälle, in denen Abhängigkeitsziele noch nicht eingetroffen sind
- Beziehungsabfragen: Fragt die Abhängigkeiten und Abhängigen eines Fragments ab

### Encryption Module

Verantwortlich für die Ende-zu-Ende-Verschlüsselung und -Entschlüsselung von Payloads unter Verwendung von durch CAP vorab ausgehandelten Schlüsseln. Stellt sicher, dass die FayGer-Laufzeitumgebung nicht auf Klartextdaten zugreifen kann.

### Session Manager

Verwaltet den Lebenszyklus von DTP-Sitzungen:

- Sitzungserstellung und -schließung
- Zustandspersistierung und -wiederherstellung
- Timeout-Erkennung und Ressourcenfreigabe

### Resume Manager

Verwaltet den sequenznummern-basierten Wiederaufnahme-Mechanismus:

- Fragment-Cache-Verwaltung
- Sequenznummern-Verfolgung
- Koordination der Wiederaufnahme am Unterbrechungspunkt

## 3.3 DTP_Engine-Zustandsmaschine

Die Betriebszustände der DTP_Engine folgen dieser Zustandsmaschine:

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
    ┌───────┐      │  ┌──────────────┐    ┌────────────────┐  │
    │ Idle  │──────┼─▶│WaitingForCAP │───▶│SessionEstablished│ │
    │       │◀─────┼──│              │◀───│                │  │
    └───────┘      │  └──────────────┘    └───────┬────────┘  │
        ▲          │                              │            │
        │          │                              ▼            │
        │          │                     ┌─────────────┐       │
        │          │                     │ Negotiating │       │
        │          │                     └──────┬──────┘       │
        │          │                            │              │
        │          │                            ▼              │
        │          │                    ┌──────────────┐       │
        │          │                    │ Transmitting │       │
        │          │                    └───────┬──────┘       │
        │          │                            │              │
        │          │                            ▼              │
        │          │  ┌──────────┐      ┌─────────────┐       │
        └──────────┼──│ Resuming │◀─────│  Suspended  │       │
                   │  └──────────┘      └─────────────┘       │
                   └──────────────────────────────────────────┘
```

Beschreibung der Zustandsübergänge:

| Aktueller Zustand | Auslösendes Ereignis | Zielzustand |
|-------------------|---------------------|-------------|
| Idle | Verbindungsanfrage empfangen | WaitingForCAP |
| WaitingForCAP | CAP-Verifizierung + Schlüsselaustausch abgeschlossen | SessionEstablished |
| WaitingForCAP | CAP-Fehler / Timeout | Idle |
| SessionEstablished | Request_Frame initiiert oder empfangen | Negotiating |
| SessionEstablished | Sitzungs-Timeout-Schließung | Idle |
| Negotiating | Agreement erreicht | Transmitting |
| Negotiating | Verhandlungsfehler / Ablehnung | SessionEstablished |
| Transmitting | Kontinuierliche Fragment-Übertragung | Transmitting |
| Transmitting | Dynamische Agreement-Anpassung | Negotiating |
| Transmitting | Verbindung unterbrochen | Suspended |
| Transmitting | Agreement beendet (keine weiteren aktiven Agreements) | SessionEstablished |
| Suspended | Verbindung wiederhergestellt + CAP-Reverifikation | Resuming |
| Suspended | Sitzungs-Timeout | Idle |
| Resuming | Wiederaufnahme-Handshake abgeschlossen | Transmitting |
| Resuming | Wiederherstellungsfehler | Idle |

## 3.4 Master-Slave-Interaktionssequenz

Eine vollständige DTP-Interaktion besteht aus fünf Phasen:

**Phase 1: CAP-Vorverarbeitung**
- CAP schließt Identitätsverifizierung und Schlüsselaustausch ab

**Phase 2: DTP-Sitzungsaufbau**
- Der Master initiiert den Sitzungsaufbau mit dem Slave und generiert eine Session_ID

**Phase 3a: Datenerfassungs-Verhandlung (Master-initiiert)**
- Master sendet einen Request_Frame (Datenerfassungsanfrage)
- Slave antwortet mit einem Response_Frame (akzeptiert / abgelehnt / Gegenvorschlag)
- Agreement wird erreicht, Agreement_ID wird generiert

**Phase 3b: Dateneinspeisung-Verhandlung (Slave-initiiert)**
- Slave sendet einen Request_Frame (Dateneinspeisungsanfrage)
- Master antwortet mit einem Response_Frame (akzeptiert / abgelehnt / Gegenvorschlag)
- Agreement wird erreicht, Agreement_ID wird generiert

**Phase 4: Datenübertragung**
- Slave → Master: Fragment (Datenerfassung, mit Agreement_ID)
- Master → Slave: Fragment (Dateneinspeisung, mit Agreement_ID)

**Phase 5: Verbindungsunterbrechung und Wiederherstellung**
- Verbindung unterbrochen → Verbindung wiederherstellen (CAP-Reverifikation) → Höchste empfangene Sequenznummer melden → Übertragung ab Unterbrechungspunkt fortsetzen
