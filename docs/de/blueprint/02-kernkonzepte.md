# Kapitel 2: Kernkonzepte

## 2.1 Master-Slave-Beziehungsmodell

DTP hat ein klar definiertes Master-Slave-Beziehungsmodell:

- **Master**: Die natürliche Person (Nutzer) oder Fay (iFay / coFay) — der ultimative Dateneigentümer und Entscheidungsträger
- **Slave**: Ein Software- oder Hardware-Endgerät — der Datenproduzent oder -konsument

### Zentrale Einschränkungen

| Einschränkung | Beschreibung | Beispiel |
|---------------|--------------|----------|
| Einzelsteuerung | Zu jedem Zeitpunkt kann ein Endgerät nur von einem Fay „bewohnt" werden | Die Smartwatch eines Nutzers kann zu einem bestimmten Zeitpunkt nur von der eigenen iFay des Nutzers gesteuert werden |
| Beobachter-Mechanismus | Der steuernde Fay kann andere Fays einladen oder autorisieren, zu beobachten (Nur-Lese-Zugriff) | Die iFay eines Nutzers steuert eine Smart-Home-Kamera und lädt die coFay eines Hausarztes ein, den Gesundheitsüberwachungs-Datenstrom zu beobachten |
| Master-Abrufrecht | Der Master hat das Recht, Daten vom Slave abzurufen; der Slave kann in den meisten Fällen nicht ablehnen | iFay fordert den Browserverlauf von einem Firmenlaptop an; der DLP-Agent des Laptops lehnt die Anfrage aufgrund der Unternehmens-Compliance-Richtlinie ab |
| Slave-Anforderungssystem | Wenn der Slave eine Dateneinspeisung vom Master anfordert, hat der Master volle Entscheidungsgewalt | Eine Ride-Hailing-App fordert die Heim- und Büroadresse des Nutzers von iFay an; iFay erkennt, dass der Nutzer pendelt, und stellt nur die Büroadresse bereit |
| Multi-Master-Wiederverwendung | Ein Slave kann von mehreren Mastern in verschiedenen Zeiträumen wiederverwendet werden | Ein gemeinsam genutzter Smart-Speaker der Familie wird tagsüber von der iFay der Mutter und nachts von der iFay des Vaters bewohnt |

## 2.2 Teilnahmemodi

DTP unterstützt zwei Teilnahmemodi:

- **Controller**: Der Fay, der das Endgerät aktuell „bewohnt", mit vollem Lese-/Schreibzugriff
- **Observer**: Ein anderer Fay, der vom Controller eingeladen oder autorisiert wurde, mit Nur-Lese-Zugriff

Observer können nur schreibgeschützte Kopien des Datenstroms empfangen und können keine Anfragen initiieren oder Agreements ändern.

## 2.3 Agreement

Ein Agreement ist ein zwischen Master und Slave ausgehandelter Datenübertragungsvertrag, der alle Parameter der Datenübertragung definiert:

- **Datentyp/-bereich**: Welche Daten übertragen werden
- **Übertragungsmodus**: Einmalig (`one_time`), periodisch (`periodic`) oder Streaming (`streaming`)
- **Übertragungsfrequenz**: Die Frequenz, mit der Daten gesendet werden
- **Gültigkeitsdauer**: Die Dauer, für die das Agreement gültig ist
- **Priorität**: Niedrig (`low`), normal (`normal`), hoch (`high`) oder kritisch (`critical`)

Jede Datenübertragung muss auf einem gegenseitig ausgehandelten Agreement basieren — es gibt keine „nackte Übertragung".

## 2.4 Data Fragment

Ein Fragment ist die Dateneinheit in DTP mit folgenden Eigenschaften:

- **Global eindeutiger Bezeichner** (Fragment_ID)
- **Ursprungszeitstempel** (Origin_Timestamp): Der Zeitpunkt, an dem die Daten tatsächlich erzeugt wurden, nicht der Übertragungszeitpunkt
- **DAG-Abhängigkeiten**: Beziehungen zu anderen Fragments
- **Agreement-Zugehörigkeit**: Gibt das zugehörige Agreement über Agreement_ID an
- **Kontext-Metadaten**: Strukturierte kontextuelle Informationen

## 2.5 Directed Acyclic Graph (DAG) Abhängigkeiten

Fragments drücken Abhängigkeitsbeziehungen durch DAG-Kanten aus und unterstützen drei Beziehungstypen:

| Beziehungstyp | Bedeutung | Beispiel |
|---------------|-----------|----------|
| `derived_from` | Abgeleitet von | Ein „Tagesschrittzahl-Zusammenfassung"-Fragment ist von einzelnen Schrittzahl-Datensatz-Fragments über den Tag hinweg abgeleitet |
| `annotates` | Annotiert | Ein Wetterdaten-Fragment annotiert ein Essenslieferungs-Bestell-Fragment und erklärt, warum der Nutzer bei hohen Temperaturen ein Eisgetränk bestellt hat |
| `supersedes` | Ersetzt | Nachdem ein Nutzer seine Lieferadresse aktualisiert hat, ersetzt das neue Adress-Fragment das alte Adress-Fragment |

Die DAG-Struktur stellt sicher, dass Beziehungen zum Zeitpunkt der Datenerfassung hergestellt werden, was iFay hilft, die Entwicklungshistorie und kausalen Zusammenhänge der Daten zu verstehen.

## 2.6 Glossar

| Begriff | Definition |
|---------|------------|
| iFay | Individual Fay — ein persönlicher KI-Avatar (digitaler Zwilling), der an eine bestimmte natürliche Person (Human Prime) gebunden ist |
| coFay | Common Fay — eine öffentliche KI-Rolle (ähnlich einem Agent) |
| Fay | Oberbegriff für anthropomorphe KI-Agenten |
| FayGer | Die Container-/Laufzeitumgebung für Fay (ähnlich Docker/JRE); wird als „öffentlicher Raum" betrachtet und sollte keinen Zugriff auf Klartextdaten haben |
| Human Prime | Die natürliche Person, an die eine iFay gebunden ist |
| Faying | Der Zustand, in dem eine iFay mit ihrem Human Prime verbunden/gepaart ist |
| Personal Data Heap | iFays privates Datenverwaltungsmodul, das Daten in mehreren Formaten speichert (das „Tagebuch" des Human Prime) |
| Sensor | iFays „Nervensystem", aufgebaut auf CAP + DTP, das Datenströme empfängt |
| Device Driver Hub | Die Treiber-Hub-Schicht, die Gerätetreiber integriert |
| DTP_Engine | Die zentrale Verarbeitungsengine des DTP-Protokolls, verantwortlich für Frame-Kodierung, Dekodierung, Verschlüsselung, Entschlüsselung und Übertragungsverwaltung |
