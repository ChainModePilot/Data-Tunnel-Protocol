# Kapitel 5: Verhandlungsmechanismus

## 5.1 Verhandlungsprinzipien

Eines der zentralen Designprinzipien von DTP ist „Verhandlung zuerst": Jede Datenübertragung muss auf von beiden Parteien ausgehandelten Agreements basieren — es gibt keine „nackte Übertragung". Der Verhandlungsmechanismus stellt sicher:

- Master und Slave erreichen vor Beginn der Datenübertragung einen expliziten Konsens über Übertragungsparameter
- Agreement-Parameter können während der Übertragung dynamisch angepasst werden
- Jede Partei kann ein Agreement proaktiv beenden

## 5.2 Verhandlungs-Frame-Typen

DTP verwendet zwei Frame-Typen zur Durchführung der Verhandlung:

### Request Frame (Request_Frame)

Wird verwendet, um Datenanfragen zu initiieren oder Übertragungs-Agreements anzupassen, und enthält folgende Elemente:

| Feld | Beschreibung |
|------|--------------|
| requestId | Eindeutiger Anfrage-Bezeichner |
| requestorRole | Rolle des Anfragenden (master / slave) |
| requestType | Anfragetyp: collection / injection / adjustment / termination |
| targetAgreementId | Referenzierte Agreement-ID bei Anpassung/Beendigung |
| proposedParams | Vorgeschlagene Agreement-Parameter |

### Response Frame (Response_Frame)

Wird verwendet, um auf Datenanfragen zu antworten, und enthält folgende Elemente:

| Feld | Beschreibung |
|------|--------------|
| requestId | Zugehörige Anfrage-ID |
| result | Verhandlungsergebnis: accepted / rejected / counter_proposal |
| agreedParams | Endgültige Parameter bei Akzeptanz oder Gegenvorschlag |
| agreementId | Bei Akzeptanz generierte Agreement-ID |
| rejectionReason | Ablehnungsgrund |

## 5.3 Verhandlungsablauf

### Datenerfassungs-Verhandlung (Master-initiiert)

```
Master                              Slave
  │                                   │
  │── Request_Frame (collection) ────▶│
  │                                   │
  │◀── Response_Frame ────────────────│
  │    (accepted / rejected /         │
  │     counter_proposal)             │
  │                                   │
```

1. Master sendet eine Datenerfassungsanfrage an Slave und spezifiziert Datentyp, Übertragungsmodus, Frequenz und andere Parameter
2. Slave antwortet über Response_Frame:
   - **Akzeptiert**: Stimmt zu, Daten gemäß den angeforderten Parametern zu übertragen
   - **Abgelehnt**: Beschränkt auf Compliance-Einschränkungen (z.B. DLP-Datenverlustpräventions-Richtlinien); muss einen Compliance-Grund enthalten
   - **Gegenvorschlag**: Schlägt modifizierte Parameter vor

### Dateneinspeisungs-Verhandlung (Slave-initiiert)

```
Slave                               Master
  │                                   │
  │── Request_Frame (injection) ─────▶│
  │                                   │
  │◀── Response_Frame ────────────────│
  │    (accepted + filtered data      │
  │     range / rejected /            │
  │     counter_proposal)             │
  │                                   │
```

1. Slave sendet eine Dateneinspeisungsanfrage an Master und beschreibt, welche Daten benötigt werden
2. Master antwortet über Response_Frame:
   - **Akzeptiert**: Enthält den gefilterten Datenbereich (minimierter Datensatz)
   - **Abgelehnt**: Daten werden nicht bereitgestellt
   - **Gegenvorschlag**: Bietet Daten in einem anderen Bereich oder Format an

## 5.4 Agreement-Parameter

Sobald beide Parteien einen Konsens erreichen, wird eine eindeutige Agreement_ID generiert. Der Agreement-Inhalt umfasst:

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| dataType | string | Datentyp-Bezeichner |
| dataRange | string | Datenbereichs-Beschreibung |
| transferMode | enum | Übertragungsmodus: one_time / periodic / streaming |
| frequency | number \| null | Übertragungsfrequenz (Hz); null für Einmal-Modus |
| validityPeriod | number | Gültigkeitsdauer (Millisekunden) |
| priority | enum | Priorität: low / normal / high / critical |

## 5.5 Agreement-Lebenszyklus

Ein Agreement durchläuft folgende Zustände:

```
negotiating ──▶ active ──▶ terminated
                  │
                  ▼
              suspended
```

- **negotiating**: Verhandlung läuft
- **active**: Agreement ist in Kraft; Datenübertragung findet statt
- **suspended**: Verbindung unterbrochen; Agreement ist pausiert
- **terminated**: Agreement wurde beendet

## 5.6 Dynamische Anpassung

DTP unterstützt die dynamische Anpassung der Parameter eines bestehenden Agreements während der Übertragung durch Senden eines neuen Request_Frame (mit requestType auf `adjustment` gesetzt).

Typisches Szenario: iFay fordert zunächst eine Smartwatch auf, die Herzfrequenz einmal pro Minute zu melden, erkennt jedoch, dass der Nutzer zu laufen begonnen hat, und passt das Agreement dynamisch auf einmal pro Sekunde an.

## 5.7 Agreement-Beendigung

Ein Agreement wird explizit durch Senden eines Request_Frame (mit requestType auf `termination` gesetzt) beendet. Nach der Beendigung stoppt die Datenübertragung unter diesem Agreement sofort.

## 5.8 Mehrere gleichzeitige Agreements

DTP unterstützt die gleichzeitige Aufrechterhaltung mehrerer aktiver Agreements innerhalb einer einzelnen Sitzung. Ob mehrere Agreements seriell oder parallel übertragen werden, hängt von den Fähigkeiten des zugrunde liegenden Transportprotokolls ab.

Beispiel: iFay unterhält gleichzeitig ein Herzfrequenz-Datenerfassungs-Agreement (einmal pro Sekunde) und ein Schrittzahl-Datenerfassungs-Agreement (einmal pro Minute) mit einer Smartwatch; die beiden Agreements arbeiten unabhängig voneinander.
