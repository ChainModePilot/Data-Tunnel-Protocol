# Kapitel 6: Datenübertragung

## 6.1 Bidirektionaler Datenfluss

DTP unterstützt Datenübertragung in beide Richtungen ohne gegenseitige Beeinträchtigung:

| Richtung | Name | Beschreibung |
|----------|------|--------------|
| Terminal → Fay | Datenerfassung | Speichert vom Endgerät erzeugte Daten dauerhaft im Personal Data Heap |
| Fay → Terminal | Dateneinspeisung | Ein von iFay gefilterter und beurteilter minimierter Datensatz |

Beide Richtungen verwenden das gleiche Logical_Frame-Format und den gleichen Verarbeitungsablauf, pflegen jedoch unabhängige Sequenznummernräume und Wiederaufnahme-Zustände.

## 6.2 Datenerfassungsablauf (Terminal → Fay)

Der vollständige Datenerfassungsablauf durchläuft folgende Schritte:

```
Terminal Application
  │
  ▼ Daten übermitteln
DTP_Slave Engine
  │ 1. Kontext-Metadaten anhängen
  │ 2. LogicalFrame erstellen (Header + Payload)
  │ 3. Payload verschlüsseln
  │ 4. LogicalFrame serialisieren
  │
  ▼ send(binary_data)
Transport_Adapter
  │
  ▼ onReceive(binary_data)
DTP_Master Engine
  │ 1. LogicalFrame deserialisieren
  │ 2. Agreement_ID validieren
  │ 3. Payload entschlüsseln
  │ 4. DAG-Abhängigkeiten validieren
  │ 5. Sequenznummer aktualisieren + Bestätigung senden
  │
  ▼ Speichern
Personal Data Heap
```

## 6.3 Dateneinspeisungsablauf (Fay → Terminal)

Der vollständige Dateneinspeisungsablauf durchläuft folgende Schritte:

```
Personal Data Heap
  │
  ▼ Daten abfragen und filtern
DTP_Master Engine
  │ 1. Fragment + Kontext-Metadaten erstellen
  │ 2. LogicalFrame erstellen
  │ 3. Payload verschlüsseln
  │ 4. LogicalFrame serialisieren
  │
  ▼ send(binary_data)
Transport_Adapter
  │
  ▼ onReceive(binary_data)
DTP_Slave Engine
  │ 1. LogicalFrame deserialisieren
  │ 2. Agreement_ID validieren
  │ 3. Payload entschlüsseln
  │ 4. Sequenznummer aktualisieren + Bestätigung senden
  │
  ▼ Daten ausliefern
Terminal Application
```

## 6.4 Agreement_ID-Komprimierte Übertragung

Um den Übertragungsoverhead zu reduzieren, unterstützt DTP die komprimierte Übertragung der Agreement_ID:

- Wenn aufeinanderfolgende Fragments zum selben Agreement gehören, trägt nur das **erste Fragment** im Batch die vollständige Agreement_ID im Header
- Nachfolgende Fragments haben ihr agreementId-Feld auf null gesetzt, was bedeutet, dass sie die vorherige erben

Empfänger-Verarbeitungsregeln:

1. Fragment mit Agreement_ID empfangen → Aktuelle Kontext-Agreement_ID aktualisieren
2. Fragment ohne Agreement_ID empfangen → Mit der zuletzt deklarierten Agreement_ID im aktuellen Kontext verknüpfen
3. Fragment mit unbekannter Agreement_ID empfangen → Verwerfen und Fehlerbenachrichtigung senden

Beispiel:

```
Fragment 1: agreementId = "abc-123"  ← Vollständige ID
Fragment 2: agreementId = null       ← Erbt "abc-123"
Fragment 3: agreementId = null       ← Erbt "abc-123"
Fragment 4: agreementId = "def-456"  ← Neues Agreement, vollständige ID
Fragment 5: agreementId = null       ← Erbt "def-456"
```

## 6.5 Sequenznummern-Verwaltung

### Monoton steigend

Jedes Fragment trägt eine Übertragungs-Sequenznummer (Sequence_Number), die innerhalb einer einzelnen Sitzung monoton steigt.

### Bidirektional unabhängig

Die Datenerfassungsrichtung und die Dateneinspeisungsrichtung pflegen vollständig unabhängige Sequenznummernräume:

```
Datenerfassungsrichtung:   seq 1, 2, 3, 4, 5 ...
Dateneinspeisungsrichtung: seq 1, 2, 3, 4, 5 ...
```

Sequenznummernänderungen in einer Richtung beeinflussen die andere Richtung nicht.

## 6.6 Ursprungszeitstempel-Erhaltung

DTP stellt sicher, dass der Ursprungszeitstempel (Origin_Timestamp) jedes Fragments während des gesamten Übertragungsprozesses unverändert bleibt:

- Zeichnet den Zeitpunkt auf, an dem die Daten **tatsächlich an der Quelle erzeugt** wurden, nicht den Übertragungszeitpunkt
- Verwendet UTC-Zeitzone mit Millisekunden-Präzision
- Nach Serialisierung, Verschlüsselung, Übertragung, Entschlüsselung und Deserialisierung bleibt der Zeitstempel identisch mit seinem Wert vor dem Senden
- Der Empfänger bewahrt den originalen Origin_Timestamp ohne Modifikation

Dies stellt sicher, dass iFay auch bei verzögertem Daten-Upload (z.B. in Offline-Szenarien) die wahre Zeitlinie rekonstruieren kann.

## 6.7 DAG-Abhängigkeitsvalidierung

Der Empfänger führt beim Empfang von Fragments eine DAG-Abhängigkeitsvalidierung durch:

1. **Zykluserkennung**: Validiert, dass die Abhängigkeitsbeziehungen des neuen Fragments keinen Zyklus im DAG bilden. Wird ein Zyklus erkannt, wird das Fragment abgelehnt
2. **Abhängigkeitsauflösung**: Wenn das Abhängigkeitsziel-Fragment noch nicht eingetroffen ist, wird das aktuelle Fragment als „Abhängigkeit ausstehend" markiert und zwischengespeichert
3. **Verzögerte Auflösung**: Wenn das abhängige Fragment eintrifft, werden zuvor zwischengespeicherte Fragments automatisch aufgelöst
