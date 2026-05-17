# Kapitel 1: Überblick und Motivation

## 1.1 Was ist das Data Tunnel Protocol

Das Data Tunnel Protocol (DTP) ist eines der sechs Kernprotokolle im iFay-Ökosystem. Es handelt sich um ein **verhandlungsbasiertes Datenübertragungskanal-Protokoll**, das für die bidirektionale Datenerfassung und -einspeisung zwischen Endgeräten und Fay verantwortlich ist.

Als Anwendungsschicht-Protokoll baut DTP auf bestehenden Transportprotokollen (BLE, RTSP, WebSocket, TCP usw.) auf. Es ist agnostisch gegenüber dem zugrunde liegenden Transportmechanismus und definiert lediglich „was übertragen wird, wie es organisiert wird, wie verhandelt wird und wie die Zustellung garantiert wird."

## 1.2 Protokoll-Motivation: Datensouveränität

Im traditionellen Modell sammeln Anwendungen eigenständig Verhaltensdaten der Nutzer für Funktionen wie Empfehlungen, wobei die Daten der Plattform gehören. Nutzer haben keine Kontrolle über ihre eigenen Daten und können nicht entscheiden, welche Daten von wem genutzt werden dürfen.

Das zentrale Wertversprechen von DTP ist **Datensouveränität**: Im KI-Zeitalter sollten persönliche Daten dem Individuum gehören (verwaltet durch iFay im Personal Data Heap), anstatt über verschiedene Anwendungsanbieter verstreut zu sein.

Datenfluss im DTP-Modell:

1. Alle Endgerätedaten werden über DTP in iFays Personal Data Heap erfasst
2. Wenn eine Endgeräteanwendung personalisierte Daten benötigt, stellt sie eine Anfrage an iFay
3. iFay beurteilt – wie ein Mensch es tun würde – welche Informationen es bereit ist bereitzustellen und in welchem Umfang, und gibt einen gefilterten, minimierten Datensatz zurück
4. Die Datensouveränität verbleibt stets beim Nutzer (Human Prime)

## 1.3 Zwei zentrale Datenflüsse

DTP implementiert zwei zentrale Datenflüsse:

- **Datenerfassung (Terminal → Fay)**: Speichert vom Endgerät erzeugte Daten dauerhaft in iFays Personal Data Heap und erreicht damit Datenverwaltung
- **Dateneinspeisung (Fay → Terminal)**: iFay stellt der Endgeräteanwendung temporär einen gefilterten und beurteilten minimierten Datensatz zur Verfügung, der personalisierte Dienste ermöglicht, ohne die Privatsphäre zu gefährden

## 1.4 Kontextualisierte Daten

Daten können ihre Bedeutung verlieren, wenn sie von ihrem ursprünglichen Kontext getrennt werden. Zum Beispiel:

- Ein Nutzer bestellt eine eisgekühlte Mungobohnensuppe über eine Essenslieferungs-App. Wird gleichzeitig die Umgebungstemperatur von 32°C erfasst, deutet dies darauf hin, dass der Nutzer wegen der Hitze ein kaltes Getränk gewählt hat
- Beträgt die Temperatur 12°C, deutet dies darauf hin, dass der Nutzer eine Vorliebe für kalte Getränke hat

DTP transportiert kontextuelle Metadaten auf Protokollebene und stellt sicher, dass der Kontext zum Zeitpunkt der Datenerfassung festgehalten wird, um die Schwierigkeit einer nachträglichen Rekonstruktion zu vermeiden. Jedes Daten-Fragment trägt strukturierte Kontext-Metadaten, einschließlich Datentyp, Quellkennung, Erfassungsumgebung und weiterer Informationen.

## 1.5 Zusammenspiel mit CAP

DTP arbeitet koordiniert mit dem Control Authorization Protocol (CAP):

- **CAP** übernimmt Verbindungsautorisierung, Identitätsverifizierung und Schlüsselaustausch
- **DTP** übernimmt die eigentliche verhandlungsbasierte Datenstromübertragung

Gemeinsam ermöglichen sie die Fähigkeit zur „direkten Client-Übernahme" ohne UI-basierte Interaktion. DTP beginnt die Datenübertragung erst, nachdem CAP die Identitätsverifizierung und den Schlüsselaustausch abgeschlossen hat, wodurch sichergestellt wird, dass beide kommunizierenden Parteien vertrauenswürdige Identitäten und nutzbare Schlüssel besitzen.
