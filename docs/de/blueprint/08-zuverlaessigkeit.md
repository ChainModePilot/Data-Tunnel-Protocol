# Kapitel 8: Zuverlässigkeit

## 8.1 Wiederaufnahme-Mechanismus

DTP implementiert einen auf Sequenznummern basierenden Wiederaufnahme-Mechanismus, der eine vollständige Datenübertragung in instabilen Netzwerkumgebungen sicherstellt.

Kernziel: Wenn die Übertragung nach einer Verbindungsunterbrechung fortgesetzt wird, müssen bereits erfolgreich empfangene Daten nicht erneut gesendet werden.

### Funktionsweise

```
Sender                              Empfänger
  │                                   │
  │── Fragment (seq=1) ──────────────▶│ ✓ Empfangen
  │── Fragment (seq=2) ──────────────▶│ ✓ Empfangen
  │── Fragment (seq=3) ──────────────▶│ ✓ Empfangen
  │── Fragment (seq=4) ────── ✗ ──────│ Verbindung verloren
  │                                   │
  │     ... Verbindung wiederhergestellt ...│
  │                                   │
  │◀── Höchste empfangene Seq melden (3)│
  │                                   │
  │── Fragment (seq=4) ──────────────▶│ Wiederaufnahme ab Unterbrechungspunkt
  │── Fragment (seq=5) ──────────────▶│
  │                                   │
```

### Sender-Verantwortlichkeiten

1. Jedem Fragment eine monoton steigende Sequenznummer zuweisen
2. Fragments lokal zwischenspeichern, die noch nicht vom Empfänger bestätigt wurden
3. Nach Empfang einer Bestätigung die bestätigten Fragments aus dem Cache entfernen
4. Nach Verbindungswiederherstellung die Übertragung ab dem Fragment fortsetzen, das auf die höchste vom Empfänger gemeldete Sequenznummer folgt

### Empfänger-Verantwortlichkeiten

1. Die höchste erfolgreich empfangene Sequenznummer verfolgen
2. Nach Verbindungswiederherstellung die höchste erfolgreich empfangene Sequenznummer an den Sender melden

## 8.2 Cache-Verwaltung

Der Sender pflegt einen lokalen Cache unbestätigter Fragments:

- Jedes Fragment, das gesendet, aber noch nicht bestätigt wurde, wird im Cache aufbewahrt
- Nach Empfang einer Bestätigung werden bestätigte Fragments aus dem Cache entfernt
- Der Cache hat eine Kapazitätsgrenze

### Behandlung bei vollem Cache

Wenn der lokale Cache des Senders seine Kapazitätsgrenze erreicht:

1. Senden neuer Fragments pausieren
2. Die übergeordnete Anwendung benachrichtigen, dass der Cache voll ist
3. Auf die Bestätigung des Empfängers warten, um Cache-Speicherplatz freizugeben, bevor die Übertragung fortgesetzt wird

## 8.3 Sitzungsverwaltung

### Sitzungsaufbau

Nachdem CAP die Identitätsverifizierung und den Schlüsselaustausch abgeschlossen hat, baut DTP_Engine eine DTP-Sitzung auf und generiert einen eindeutigen Sitzungsbezeichner (Session_ID).

### Sitzungszustandspflege

DTP_Engine pflegt den bidirektionalen Übertragungszustand innerhalb der Sitzung:

| Zustandselement | Beschreibung |
|-----------------|--------------|
| currentSequenceNumber | Aktuelle Sequenznummer |
| highestAcknowledgedSequenceNumber | Höchste bestätigte Sequenznummer |
| unacknowledgedFragmentCache | Cache unbestätigter Fragments |
| activeAgreements | Liste aktiver Agreements |

Jede Richtung (Erfassung und Einspeisung) pflegt einen unabhängigen Übertragungszustand.

### Sitzungspersistierung

Wenn die zugrunde liegende Transportverbindung unterbrochen wird, persistiert DTP_Engine den Sitzungszustand (einschließlich aller aktiven Agreements) im Speicher, um eine nachfolgende Verbindungswiederherstellung zu unterstützen.

### Sitzungswiederherstellung

Nachdem die Verbindung wiederhergestellt und die CAP-Reverifikation bestanden wurde, stellt DTP_Engine den vorherigen Sitzungszustand (einschließlich aktiver Agreements) wieder her und setzt die Übertragung fort.

Wiederherstellungsablauf:

1. Zugrunde liegende Verbindung wird wiederhergestellt
2. CAP verifiziert die Identität erneut
3. DTP_Engine stellt den Sitzungszustand aus dem persistenten Speicher wieder her
4. Empfänger meldet die höchste empfangene Sequenznummer
5. Sender setzt die Übertragung ab dem Unterbrechungspunkt fort

### Sitzungs-Timeout

Wenn eine Sitzung über den protokollkonfigurierten Timeout-Schwellenwert hinaus inaktiv bleibt, schließt DTP_Engine die Sitzung und gibt zugehörige Ressourcen frei. Nach einem Timeout muss eine neue Sitzung aufgebaut werden.

## 8.4 Neuübertragungsmechanismus

Wenn der Sender innerhalb des protokollkonfigurierten Neuübertragungszeitraums keine Bestätigung vom Empfänger erhält, überträgt er unbestätigte Fragments automatisch erneut.

Neuübertragungsstrategie:

1. Den konfigurierten Timeout-Zeitraum abwarten
2. Unbestätigte Fragments nach Timeout erneut übertragen
3. Wenn die Neuübertragungsanzahl den Schwellenwert überschreitet, die übergeordnete Anwendung über den Übertragungsfehler benachrichtigen

## 8.5 Typische Szenarien

### Szenario 1: U-Bahn-Tunnel

Das Telefon eines Nutzers verliert im U-Bahn-Tunnel die Netzwerkverbindung, nachdem 300 von 500 Trainingsdatensätzen hochgeladen wurden. Nach dem Verlassen des Tunnels und der Wiederherstellung der Verbindung setzt DTP die Übertragung ab Datensatz 301 fort, ohne die ersten 300 erneut zu senden.

### Szenario 2: Bluetooth-Reichweite überschritten

Die Smartwatch eines Nutzers verliert die Bluetooth-Verbindung zum Telefon aufgrund zu großer Entfernung. Wenn der Nutzer in die Nähe zurückkehrt, wird die Verbindung automatisch wiederhergestellt, und die Uhr fährt mit dem Hochladen der während der Unterbrechung angesammelten Herzfrequenzdaten fort.

### Szenario 3: Server-Neustart

Die FayGer-Instanz, die iFay hostet, startet neu; der DTP-Sitzungszustand wurde persistiert. Nach dem Neustart wird die Sitzung wiederhergestellt und der Datenempfang vom Endgerät wird ab dem Unterbrechungspunkt fortgesetzt.
