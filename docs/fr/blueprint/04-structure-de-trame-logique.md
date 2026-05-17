# Chapitre 4 : Structure de trame logique

## 4.1 Composition de la trame

Un LogicalFrame est la structure de trame de couche applicative de DTP, composée de deux parties :

```
┌─────────────────────────────────────────┐
│              Logical_Frame               │
├─────────────────────────────────────────┤
│  Header                                  │
│  ┌─────────────────────────────────────┐│
│  │ protocolVersion   Version du protocole││
│  │ frameType         ID du type de trame││
│  │ fragmentId        ID unique du Fragment││
│  │ agreementId       ID de l'Agreement  ││
│  │                   (compressible)     ││
│  │ originTimestamp   Horodatage d'origine││
│  │ dagDependencies   Liste des dépendances DAG││
│  │ encryptionMetadata Métadonnées de chiffrement││
│  │ sequenceNumber    Numéro de séquence ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Payload                                 │
│  ┌─────────────────────────────────────┐│
│  │ Contenu de données réelles chiffré   ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Décisions de conception clés :

- Les métadonnées de chiffrement dans le header ne sont **pas chiffrées**, afin que le récepteur puisse déterminer la méthode de déchiffrement
- Le LogicalFrame utilise la **même définition de structure de trame** dans les deux directions Terminal→Fay et Fay→Terminal
- Lorsque le transport physique nécessite une fragmentation, l'opération de fragmentation est déléguée au Transport_Adapter sous-jacent ; le LogicalFrame maintient son intégrité

## 4.2 Types de trames

DTP définit quatre types de trames :

| Type de trame | Identifiant | Objectif |
|---------------|-------------|----------|
| Trame de données | `data` | Transporte les données réelles du Fragment |
| Trame de requête | `request` | Initie des requêtes de données ou ajuste les agreements de transmission |
| Trame de réponse | `response` | Répond aux requêtes de données, contenant l'acceptation, le rejet ou les résultats de négociation |
| Trame de contrôle | `control` | Transmet les notifications d'erreur, la terminaison d'agreement et d'autres informations de contrôle |

## 4.3 Détails des champs du header

### Version du protocole (protocolVersion)

```
{ major: number, minor: number }
```

Identifie la version du protocole utilisée par la trame actuelle. Le récepteur l'utilise pour déterminer la compatibilité.

### Identifiant du type de trame (frameType)

Identifie le type de la trame, déterminant comment le payload doit être analysé.

### Identifiant unique du Fragment (fragmentId)

Un identifiant UUID v4 globalement unique utilisé pour le référencement et le suivi au sein du DAG.

### ID de l'Agreement (agreementId)

Identifie l'agreement auquel ce Fragment appartient. Prend en charge la transmission compressée : lorsque des Fragments consécutifs appartiennent au même agreement, seul le premier Fragment du lot porte l'Agreement_ID complet dans son header ; les Fragments suivants peuvent l'omettre (défini à null).

Règles du récepteur :
- Lorsqu'un Fragment sans Agreement_ID est reçu, il est associé à l'Agreement_ID le plus récemment déclaré dans le contexte actuel
- Lorsqu'un Fragment référençant un Agreement_ID inconnu est reçu, le Fragment est rejeté et une notification d'erreur « agreement non trouvé » est envoyée

### Horodatage d'origine (originTimestamp)

Le moment où les données ont été réellement produites à la source, utilisant le fuseau horaire UTC avec une précision à la milliseconde. Stocké séparément de l'horodatage de transmission et non affecté par les délais de transmission.

Exemple : un utilisateur enregistre 30 minutes de données de fréquence cardiaque hors ligne dans le métro. Après être sorti de la station, les données sont téléchargées en masse — chaque enregistrement conserve l'horodatage du moment réel de la mesure, et non le moment du téléchargement.

### Liste des dépendances DAG (dagDependencies)

Déclare les relations de dépendance avec d'autres Fragments. Chaque dépendance inclut :
- L'ID du Fragment cible
- Le type de relation (`derived_from` / `annotates` / `supersedes`)

Prend en charge la déclaration de zéro ou plusieurs relations de dépendance.

### Métadonnées de chiffrement (encryptionMetadata)

```
{ algorithm: string, keyVersion: number }
```

- `algorithm` : identifiant de l'algorithme de chiffrement (par ex., "AES-256-GCM")
- `keyVersion` : numéro de version de la clé

Les métadonnées de chiffrement elles-mêmes ne sont pas chiffrées, afin que le récepteur puisse déterminer les paramètres de déchiffrement.

### Numéro de séquence (sequenceNumber)

Le numéro de séquence de transmission, croissant de manière monotone au sein d'une session unique, utilisé pour le mécanisme de reprise. Chaque direction de transmission maintient un espace de numéros de séquence indépendant.

## 4.4 Sérialisation et désérialisation

DTP_Engine sérialise les objets LogicalFrame en format binaire pour la transmission ; le récepteur désérialise les données binaires en objets LogicalFrame.

Garantie fondamentale — **cohérence aller-retour** : pour tout objet LogicalFrame valide, le sérialiser puis le désérialiser doit produire un LogicalFrame équivalent à l'objet original.

DTP_Engine fournit également une fonction de sortie formatée (Pretty Printer) qui convertit les objets LogicalFrame en un format texte lisible par l'humain à des fins de débogage et de journalisation.

## 4.5 Métadonnées contextuelles

Chaque Fragment transporte des métadonnées contextuelles structurées (ContextMetadata), incluant :

- **Identifiant du type de données** (dataType) : décrit le type de données
- **Source des données** (source) : distingue entre les sources matérielles et logicielles
- **Champs personnalisés** (customFields) : une structure extensible de paires clé-valeur

### Source matérielle

Lorsque les données proviennent d'un capteur matériel, les métadonnées incluent :
- Type de capteur (sensorType)
- Précision du capteur (precision)
- Taux d'échantillonnage (samplingRate, en Hz)

### Source logicielle

Lorsque les données proviennent d'un partage logiciel, les métadonnées incluent :
- Identifiant de l'application source (appIdentifier)
- Description de la méthode de partage (sharingMethod)
