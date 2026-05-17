# Kapitel 7: Sicherheit und Verschlüsselung

## 7.1 Ende-zu-Ende-Verschlüsselungsdesign

DTP implementiert Ende-zu-Ende-Verschlüsselung und stellt sicher, dass Daten während der Übertragung nicht gestohlen oder manipuliert werden können, selbst wenn sie durch nicht vertrauenswürdige Zwischenumgebungen (wie die FayGer-Laufzeitumgebung) geleitet werden.

Kerngarantie: **Nur die Ziel-iFay-Instanz kann die empfangenen Payload-Daten entschlüsseln; die FayGer-Laufzeitumgebung kann nicht auf Klartext zugreifen.**

Selbst wenn iFay auf einer öffentlichen Cloud-FayGer-Instanz läuft, kann der Cloud-Dienstanbieter die Gesundheitsdaten, Standortinformationen oder Verbrauchsdaten des Nutzers nicht lesen.

## 7.2 Verschlüsselungsumfang

```
┌─────────────────────────────────────┐
│           Logical_Frame              │
├─────────────────────────────────────┤
│  Header — Klartext-Übertragung       │
│  ┌─────────────────────────────────┐│
│  │ ...                             ││
│  │ encryptionMetadata — Klartext   ││
│  │   algorithm: "AES-256-GCM"     ││
│  │   keyVersion: 3                ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  Payload — Verschlüsselte Übertragung│
│  ┌─────────────────────────────────┐│
│  │ ████████████████████████████    ││
│  │ ████████ Verschlüsselte Daten █ ││
│  │ ████████████████████████████    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

- **Header**: Klartext-Übertragung; enthält Meta-Informationen, die für Routing und Verarbeitung benötigt werden
- **Verschlüsselungs-Metadaten**: Klartext-Übertragung; enthält den Verschlüsselungsalgorithmus-Bezeichner und die Schlüsselversionsnummer, damit der Empfänger die Entschlüsselungsmethode bestimmen kann
- **Payload**: Verschlüsselte Übertragung; enthält den eigentlichen Dateninhalt

## 7.3 Schlüsselverwaltung

DTP verwaltet Schlüssel nicht selbst, sondern stützt sich auf durch CAP (Control Authorization Protocol) vorab ausgehandelte Schlüssel:

1. CAP schließt Identitätsverifizierung und Schlüsselaustausch während der Verbindungsaufbauphase ab
2. DTP verwendet die von CAP bereitgestellten Schlüssel für die Payload-Verschlüsselung/-Entschlüsselung
3. Die Schlüsselversionsnummer (keyVersion) identifiziert den aktuell verwendeten Schlüssel

### CAP-Voraussetzung

Vor Beginn der Datenübertragung **muss** DTP verifizieren, dass CAP den Identitätsverifizierungs- und Schlüsselaustauschprozess abgeschlossen hat. Wenn der CAP-Schlüsselaustausch noch nicht abgeschlossen ist, verweigert DTP_Engine das Senden von Daten und gibt einen „Schlüssel nicht bereit"-Fehler (KEY_NOT_READY) zurück.

## 7.4 Verschlüsselungs-Metadaten

Der Header jedes Logical_Frame trägt Verschlüsselungs-Metadaten:

| Feld | Beschreibung |
|------|--------------|
| algorithm | Verschlüsselungsalgorithmus-Bezeichner, z.B. „AES-256-GCM" |
| keyVersion | Schlüsselversionsnummer, die identifiziert, welche Version des Schlüssels verwendet wird |

Die Verschlüsselungs-Metadaten selbst sind nicht verschlüsselt, um sicherzustellen, dass der Empfänger die Entschlüsselungsparameter vor der Entschlüsselung bestimmen kann.

## 7.5 Verschlüsselungs-Roundtrip-Konsistenz

DTP garantiert Verschlüsselungs-Roundtrip-Konsistenz:

- Verschlüsselung und anschließende Entschlüsselung mit dem **korrekten Schlüssel** sollte eine Payload erzeugen, die den Originaldaten entspricht
- Entschlüsselung mit einem **falschen Schlüssel** sollte fehlschlagen und einen DECRYPTION_FAILED-Fehler zurückgeben

## 7.6 Endgeräteseitige Entschlüsselung

Wenn das Endgerät der Empfänger ist (Dateneinspeisungs-Szenario), verwendet DTP_Engine den Schlüssel, den das Endgerät während der CAP-Verbindungsaufbauphase übermittelt hat, zur Entschlüsselung.

## 7.7 Schutz vor Sicherheitsbedrohungen

| Bedrohung | DTP-Schutzmaßnahme |
|-----------|-------------------|
| Man-in-the-Middle-Abhören | Payload-Ende-zu-Ende-Verschlüsselung; Zwischenknoten können keinen Klartext lesen |
| FayGer-Ausspähung | FayGer kann nur die verschlüsselte Payload sehen und kann sie nicht entschlüsseln |
| Schlüsselkompromittierung | Schlüsselversionsnummern-Mechanismus unterstützt Schlüsselrotation |
| Identitätsfälschung | Stützt sich auf CAPs Identitätsverifizierungsmechanismus |
| Replay-Angriffe | Monoton steigende Sequenznummern + Sitzungsbindung |
