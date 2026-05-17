# Kapitel 4: Logische Rahmenstruktur

## 4.1 Frame-Aufbau

Ein Logical_Frame ist DTPs Anwendungsschicht-Rahmenstruktur, bestehend aus zwei Teilen:

```
┌─────────────────────────────────────────┐
│              Logical_Frame               │
├─────────────────────────────────────────┤
│  Header                                  │
│  ┌─────────────────────────────────────┐│
│  │ protocolVersion   Protokollversion   ││
│  │ frameType         Frame-Typ-ID       ││
│  │ fragmentId        Fragment-UUID      ││
│  │ agreementId       Agreement-ID       ││
│  │                   (komprimierbar)    ││
│  │ originTimestamp   Ursprungszeitstempel││
│  │ dagDependencies   DAG-Abhängigkeitsliste││
│  │ encryptionMetadata Verschlüsselungs-Meta││
│  │ sequenceNumber    Sequenznummer      ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Payload                                 │
│  ┌─────────────────────────────────────┐│
│  │ Verschlüsselter eigentlicher        ││
│  │ Dateninhalt                          ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Zentrale Designentscheidungen:

- Die Verschlüsselungs-Metadaten im Header sind **nicht verschlüsselt**, damit der Empfänger die Entschlüsselungsmethode bestimmen kann
- Logical_Frame verwendet die **gleiche Frame-Strukturdefinition** in beiden Richtungen: Terminal→Fay und Fay→Terminal
- Wenn der physische Transport eine Fragmentierung erfordert, wird die Fragmentierungsoperation an den zugrunde liegenden Transport_Adapter delegiert; der Logical_Frame behält seine Integrität

## 4.2 Frame-Typen

DTP definiert vier Frame-Typen:

| Frame-Typ | Bezeichner | Zweck |
|-----------|-----------|-------|
| Data Frame | `data` | Transportiert eigentliche Fragment-Daten |
| Request Frame | `request` | Initiiert Datenanfragen oder passt Übertragungs-Agreements an |
| Response Frame | `response` | Antwortet auf Datenanfragen, enthält Akzeptanz-, Ablehnungs- oder Verhandlungsergebnisse |
| Control Frame | `control` | Übermittelt Fehlerbenachrichtigungen, Agreement-Beendigung und andere Steuerungsinformationen |

## 4.3 Header-Felddetails

### Protokollversion (protocolVersion)

```
{ major: number, minor: number }
```

Identifiziert die vom aktuellen Frame verwendete Protokollversion. Der Empfänger nutzt dies zur Kompatibilitätsbestimmung.

### Frame-Typ-Bezeichner (frameType)

Identifiziert den Typ des Frames und bestimmt, wie die Payload geparst werden soll.

### Fragment-Eindeutiger-Bezeichner (fragmentId)

Ein global eindeutiger UUID-v4-Bezeichner, der für Referenzierung und Nachverfolgung innerhalb des DAG verwendet wird.

### Agreement-ID (agreementId)

Identifiziert das Agreement, zu dem dieses Fragment gehört. Unterstützt komprimierte Übertragung: Wenn aufeinanderfolgende Fragments zum selben Agreement gehören, trägt nur das erste Fragment im Batch die vollständige Agreement_ID im Header; nachfolgende Fragments können sie weglassen (auf null gesetzt).

Empfängerregeln:
- Wenn ein Fragment ohne Agreement_ID empfangen wird, wird es dem zuletzt deklarierten Agreement_ID im aktuellen Kontext zugeordnet
- Wenn ein Fragment mit einer unbekannten Agreement_ID empfangen wird, wird das Fragment verworfen und eine „Agreement nicht gefunden"-Fehlerbenachrichtigung gesendet

### Ursprungszeitstempel (originTimestamp)

Der Zeitpunkt, an dem die Daten tatsächlich an der Quelle erzeugt wurden, in UTC-Zeitzone mit Millisekunden-Präzision. Wird getrennt vom Übertragungszeitstempel gespeichert und ist von Übertragungsverzögerungen unbeeinflusst.

Beispiel: Ein Nutzer zeichnet 30 Minuten Herzfrequenzdaten offline in der U-Bahn auf. Nach dem Verlassen der Station werden die Daten gesammelt hochgeladen — jeder Datensatz behält den Zeitstempel des tatsächlichen Messzeitpunkts bei, nicht den des Upload-Zeitpunkts.

### DAG-Abhängigkeitsliste (dagDependencies)

Deklariert Abhängigkeitsbeziehungen zu anderen Fragments. Jede Abhängigkeit umfasst:
- Ziel-Fragment_ID
- Beziehungstyp (`derived_from` / `annotates` / `supersedes`)

Unterstützt die Deklaration von null oder mehr Abhängigkeitsbeziehungen.

### Verschlüsselungs-Metadaten (encryptionMetadata)

```
{ algorithm: string, keyVersion: number }
```

- `algorithm`: Verschlüsselungsalgorithmus-Bezeichner (z.B. „AES-256-GCM")
- `keyVersion`: Schlüsselversionsnummer

Die Verschlüsselungs-Metadaten selbst sind nicht verschlüsselt, damit der Empfänger die Entschlüsselungsparameter bestimmen kann.

### Sequenznummer (sequenceNumber)

Die Übertragungs-Sequenznummer, monoton steigend innerhalb einer einzelnen Sitzung, verwendet für den Wiederaufnahme-Mechanismus. Jede Übertragungsrichtung pflegt einen unabhängigen Sequenznummernraum.

## 4.4 Serialisierung und Deserialisierung

DTP_Engine serialisiert Logical_Frame-Objekte in Binärformat zur Übertragung; der Empfänger deserialisiert Binärdaten zurück in Logical_Frame-Objekte.

Kerngarantie — **Roundtrip-Konsistenz**: Für jedes gültige Logical_Frame-Objekt sollte die Serialisierung und anschließende Deserialisierung ein dem Original äquivalentes Logical_Frame-Objekt erzeugen.

DTP_Engine bietet außerdem eine formatierte Ausgabefunktion (Pretty Printer), die Logical_Frame-Objekte in ein menschenlesbares Textformat für Debugging- und Protokollierungszwecke konvertiert.

## 4.5 Kontext-Metadaten

Jedes Fragment trägt strukturierte Kontext-Metadaten (ContextMetadata), einschließlich:

- **Datentyp-Bezeichner** (dataType): Beschreibt den Typ der Daten
- **Datenquelle** (source): Unterscheidet zwischen Hardware-Quellen und Software-Quellen
- **Benutzerdefinierte Felder** (customFields): Eine erweiterbare Schlüssel-Wert-Paar-Struktur

### Hardware-Quelle

Wenn Daten von einem Hardware-Sensor stammen, umfassen die Metadaten:
- Sensortyp (sensorType)
- Sensorpräzision (precision)
- Abtastrate (samplingRate, in Hz)

### Software-Quelle

Wenn Daten aus Software-Sharing stammen, umfassen die Metadaten:
- Quellanwendungs-Bezeichner (appIdentifier)
- Freigabemethoden-Beschreibung (sharingMethod)
