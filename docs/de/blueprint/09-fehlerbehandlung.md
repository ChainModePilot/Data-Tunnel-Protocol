# Kapitel 9: Fehlerbehandlung

## 9.1 Fehlerbehandlungsmodell

Die Fehlerbehandlung von DTP folgt einem dreiphasigen „Erkennen-Benachrichtigen-Wiederherstellen"-Modell:

1. **Erkennen**: Abnormale Zustände identifizieren
2. **Benachrichtigen**: Fehlerinformationen an die Gegenstelle oder die übergeordnete Schicht senden
3. **Wiederherstellen**: Wiederherstellungsmaßnahmen basierend auf dem Fehlertyp ergreifen

## 9.2 Fehlercode-System

DTP definiert einen eindeutigen Fehlercode für jeden Fehlertyp, unterteilt in acht Bereiche nach Funktionsmodul:

| Fehlerkategorie | Codebereich | Behandlungsstrategie |
|-----------------|-------------|---------------------|
| Frame-Verarbeitungsfehler | 1xxx | Frame verwerfen + Sender benachrichtigen + protokollieren |
| Verschlüsselungsfehler | 2xxx | Frame verwerfen + Sender benachrichtigen + kann Schlüsselneuverhandlung auslösen |
| Agreement-Fehler | 3xxx | Fragment verwerfen + Sender benachrichtigen + kann Neuverhandlung auslösen |
| DAG-Fehler | 4xxx | Fragment ablehnen + Sender benachrichtigen, oder zwischenspeichern und warten |
| Sitzungsfehler | 5xxx | Sitzungswiederherstellung versuchen + bei Fehlschlag schließen und übergeordnete Schicht benachrichtigen |
| Wiederaufnahme-Fehler | 6xxx | Senden pausieren + übergeordnete Anwendung benachrichtigen |
| Versionsfehler | 7xxx | Versionsinkompatibilitäts-Benachrichtigung senden + Downgrade versuchen |
| Berechtigungsfehler | 8xxx | Operation ablehnen + Anfragenden benachrichtigen |

## 9.3 Fehlercode-Referenz

### Frame-Verarbeitungsfehler (1xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 1001 | FRAME_DESERIALIZATION_FAILED | Frame-Deserialisierung fehlgeschlagen |
| 1002 | FRAME_INVALID_FORMAT | Ungültiges Frame-Format |

### Verschlüsselungsfehler (2xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 2001 | DECRYPTION_FAILED | Payload-Entschlüsselung fehlgeschlagen |
| 2002 | KEY_NOT_READY | Schlüssel nicht bereit (CAP nicht abgeschlossen) |

### Agreement-Fehler (3xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 3001 | AGREEMENT_NOT_FOUND | Agreement nicht gefunden |
| 3002 | AGREEMENT_EXPIRED | Agreement abgelaufen |
| 3003 | AGREEMENT_NEGOTIATION_FAILED | Agreement-Verhandlung fehlgeschlagen |

### DAG-Fehler (4xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 4001 | DAG_CYCLE_DETECTED | DAG-Zyklus erkannt |
| 4002 | DAG_DEPENDENCY_UNRESOLVED | DAG-Abhängigkeit unaufgelöst |

### Sitzungsfehler (5xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 5001 | SESSION_NOT_FOUND | Sitzung nicht gefunden |
| 5002 | SESSION_TIMEOUT | Sitzungs-Timeout |
| 5003 | SESSION_RESTORE_FAILED | Sitzungswiederherstellung fehlgeschlagen |

### Wiederaufnahme-Fehler (6xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 6001 | BUFFER_FULL | Puffer voll |
| 6002 | RETRANSMISSION_TIMEOUT | Neuübertragungszeitüberschreitung |

### Versionsfehler (7xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 7001 | VERSION_INCOMPATIBLE | Version inkompatibel |

### Berechtigungsfehler (8xxx)

| Fehlercode | Name | Beschreibung |
|------------|------|--------------|
| 8001 | PERMISSION_DENIED | Berechtigung verweigert |
| 8002 | OBSERVER_WRITE_DENIED | Observer-Schreiboperation verweigert |

## 9.4 Fehlerbenachrichtigungsmechanismus

Fehlerbenachrichtigungen werden über Control Frames übermittelt und enthalten folgende Informationen:

| Feld | Beschreibung |
|------|--------------|
| errorCode | Fehlercode |
| errorMessage | Fehlerbeschreibungsnachricht |
| relatedFrameId | ID des Frames, der den Fehler ausgelöst hat (optional) |
| relatedAgreementId | Zugehörige Agreement-ID (optional) |
| details | Zusätzliche Details (optional) |

## 9.5 Wichtige Fehlerszenarien

### Deserialisierungsfehler

Wenn ein empfangener Logical_Frame nicht korrekt deserialisiert werden kann:
1. Frame verwerfen
2. Eine FRAME_DESERIALIZATION_FAILED (1001) Fehlerbenachrichtigung an den Sender senden

### Entschlüsselungsfehler

Wenn die Payload eines empfangenen Logical_Frame nicht korrekt entschlüsselt werden kann:
1. Frame verwerfen
2. Eine DECRYPTION_FAILED (2001) Fehlerbenachrichtigung an den Sender senden
3. Wenn aufeinanderfolgende Fehler den Schwellenwert überschreiten, CAP-Schlüsselneuverhandlung auslösen

### DAG-Zykluserkennung

Wenn die deklarierten Abhängigkeitsbeziehungen eines Fragments einen Zyklus im DAG bilden würden:
1. Fragment ablehnen
2. Einen DAG_CYCLE_DETECTED (4001) Fehler zurückgeben

### Unbekanntes Agreement

Wenn ein Fragment eine Agreement_ID referenziert, die beim Empfänger nicht existiert:
1. Fragment verwerfen
2. Einen AGREEMENT_NOT_FOUND (3001) Fehler zurückgeben

### Schlüssel nicht bereit

Wenn versucht wird, Daten zu senden, aber der CAP-Schlüsselaustausch noch nicht abgeschlossen ist:
1. Senden verweigern
2. Einen KEY_NOT_READY (2002) Fehler an den übergeordneten Aufrufer zurückgeben

### Puffer voll

Wenn der Cache unbestätigter Fragments des Senders seine Kapazitätsgrenze erreicht:
1. Senden neuer Fragments pausieren
2. Eine BUFFER_FULL (6001) Benachrichtigung an die übergeordnete Anwendung senden

### Observer-Berechtigungsverletzung

Wenn ein Observer versucht, eine Anfrage zu initiieren oder ein Agreement zu ändern:
1. Operation ablehnen
2. Einen OBSERVER_WRITE_DENIED (8002) Fehler zurückgeben
