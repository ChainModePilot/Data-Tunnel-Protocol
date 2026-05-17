# Kapitel 10: Versionsverwaltung

## 10.1 Versionsnummernformat

DTP verwendet semantische Versionierung mit einer Hauptversionsnummer und einer Nebenversionsnummer:

```
{ major: number, minor: number }
```

Der Header jedes Logical_Frame enthält ein Protokollversionsnummern-Feld, das die von diesem Frame verwendete Protokollversion identifiziert.

## 10.2 Versionskompatibilitätsregeln

DTP_Engine unterstützt die gleichzeitige Verarbeitung von Logical_Frame-Formaten sowohl der **aktuellen Version** als auch der **vorherigen Hauptversion**.

| Empfangene Frame-Version | Behandlung |
|--------------------------|------------|
| Aktuelle Version | Normale Verarbeitung |
| Vorherige Hauptversion | Kompatible Verarbeitung (abwärtskompatibel) |
| Höhere Version | Versionsinkompatibilitäts-Benachrichtigung senden |
| Niedrigere Version (außerhalb des Kompatibilitätsbereichs) | Versionsinkompatibilitäts-Benachrichtigung senden |

## 10.3 Behandlung von Versionsinkompatibilität

Wenn der Empfänger einen Logical_Frame empfängt, dessen Header-Protokollversionsnummer höher ist als seine unterstützte Version:

1. Frame nicht verarbeiten
2. Eine Versionsinkompatibilitäts-Benachrichtigung (VERSION_INCOMPATIBLE, 7001) an den Sender senden
3. Die höchste unterstützte Versionsnummer des Empfängers in die Benachrichtigung aufnehmen

Nach Empfang einer Versionsinkompatibilitäts-Benachrichtigung kann der Sender:
- Auf die vom Empfänger unterstützte Version herunterstufen und erneut senden
- Oder die übergeordnete Anwendung über die Versionsdiskrepanz benachrichtigen

## 10.4 Protokoll-Evolutionsstrategie

Die Versionsverwaltung von DTP stellt Abwärtskompatibilität bei der Protokollevolution sicher:

- **Nebenversionsaktualisierung**: Fügt neue Felder oder Funktionen hinzu, ohne das Parsen bestehender Frame-Formate zu beeinträchtigen
- **Hauptversionsaktualisierung**: Kann das Frame-Format ändern, behält aber die Kompatibilität mit der vorherigen Hauptversion bei

Dies bedeutet, dass Endgeräte und Fay nicht gleichzeitig aktualisiert werden müssen — solange der Versionsunterschied innerhalb einer Hauptversion liegt, können beide Parteien normal kommunizieren.
