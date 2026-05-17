# Chapitre 6 : Transmission de données

## 6.1 Flux de données bidirectionnel

DTP prend en charge la transmission de données dans les deux directions sans interférence mutuelle :

| Direction | Nom | Description |
|-----------|-----|-------------|
| Terminal → Fay | Collecte de données | Stocke de manière persistante les données produites par le terminal dans le Personal Data Heap |
| Fay → Terminal | Injection de données | Un jeu de données minimisé filtré et évalué par iFay |

Les deux directions utilisent le même format LogicalFrame et le même flux de traitement, mais maintiennent des espaces de numéros de séquence et des états de reprise indépendants.

## 6.2 Flux de collecte de données (Terminal → Fay)

Le flux complet de collecte de données passe par les étapes suivantes :

```
Terminal Application
  │
  ▼ Soumettre les données
DTP_Slave Engine
  │ 1. Attacher les métadonnées contextuelles
  │ 2. Construire le LogicalFrame (Header + Payload)
  │ 3. Chiffrer le Payload
  │ 4. Sérialiser le LogicalFrame
  │
  ▼ send(binary_data)
Transport_Adapter
  │
  ▼ onReceive(binary_data)
DTP_Master Engine
  │ 1. Désérialiser le LogicalFrame
  │ 2. Valider l'Agreement_ID
  │ 3. Déchiffrer le Payload
  │ 4. Valider les dépendances DAG
  │ 5. Mettre à jour le numéro de séquence + envoyer l'accusé de réception
  │
  ▼ Stocker
Personal Data Heap
```

## 6.3 Flux d'injection de données (Fay → Terminal)

Le flux complet d'injection de données passe par les étapes suivantes :

```
Personal Data Heap
  │
  ▼ Interroger et filtrer les données
DTP_Master Engine
  │ 1. Construire le Fragment + métadonnées contextuelles
  │ 2. Construire le LogicalFrame
  │ 3. Chiffrer le Payload
  │ 4. Sérialiser le LogicalFrame
  │
  ▼ send(binary_data)
Transport_Adapter
  │
  ▼ onReceive(binary_data)
DTP_Slave Engine
  │ 1. Désérialiser le LogicalFrame
  │ 2. Valider l'Agreement_ID
  │ 3. Déchiffrer le Payload
  │ 4. Mettre à jour le numéro de séquence + envoyer l'accusé de réception
  │
  ▼ Livrer les données
Terminal Application
```

## 6.4 Transmission compressée de l'Agreement_ID

Pour réduire la surcharge de transmission, DTP prend en charge la transmission compressée de l'Agreement_ID :

- Lorsque des Fragments consécutifs appartiennent au même agreement, seul le **premier Fragment** du lot porte l'Agreement_ID complet dans son header
- Les Fragments suivants ont leur champ agreementId défini à null, indiquant qu'ils héritent du précédent

Règles de traitement du récepteur :

1. Fragment reçu avec Agreement_ID → Mettre à jour l'Agreement_ID du contexte actuel
2. Fragment reçu sans Agreement_ID → Associer à l'Agreement_ID le plus récemment déclaré dans le contexte actuel
3. Fragment reçu référençant un Agreement_ID inconnu → Rejeter et envoyer une notification d'erreur

Exemple :

```
Fragment 1: agreementId = "abc-123"  ← ID complet
Fragment 2: agreementId = null       ← Hérite de "abc-123"
Fragment 3: agreementId = null       ← Hérite de "abc-123"
Fragment 4: agreementId = "def-456"  ← Nouvel agreement, ID complet
Fragment 5: agreementId = null       ← Hérite de "def-456"
```

## 6.5 Gestion des numéros de séquence

### Croissance monotone

Chaque Fragment porte un numéro de séquence de transmission (Sequence_Number) qui croît de manière monotone au sein d'une session unique.

### Indépendance bidirectionnelle

La direction de collecte de données et la direction d'injection de données maintiennent des espaces de numéros de séquence complètement indépendants :

```
Direction de collecte de données :  seq 1, 2, 3, 4, 5 ...
Direction d'injection de données :  seq 1, 2, 3, 4, 5 ...
```

Les changements de numéro de séquence dans une direction n'affectent pas l'autre direction.

## 6.6 Préservation de l'horodatage d'origine

DTP garantit que l'horodatage d'origine (Origin_Timestamp) de chaque Fragment reste inchangé tout au long du processus de transmission :

- Enregistre le moment où les données ont été **réellement produites** à la source, et non le moment de la transmission
- Utilise le fuseau horaire UTC avec une précision à la milliseconde
- Après la sérialisation, le chiffrement, la transmission, le déchiffrement et la désérialisation, l'horodatage reste identique à sa valeur avant l'envoi
- Le récepteur préserve l'Origin_Timestamp original sans modification

Cela garantit que même lorsque les données sont téléchargées avec un délai (par ex., dans des scénarios hors ligne), iFay peut reconstruire la chronologie réelle.

## 6.7 Validation des dépendances DAG

Le récepteur effectue la validation des dépendances DAG lors de la réception des Fragments :

1. **Détection de cycles** : valide que les relations de dépendance du nouveau Fragment ne forment pas un cycle dans le DAG. Si un cycle est détecté, le Fragment est rejeté
2. **Résolution des dépendances** : si le Fragment cible de la dépendance n'est pas encore arrivé, le Fragment actuel est marqué comme « dépendance en attente de résolution » et mis en cache
3. **Résolution différée** : lorsque le Fragment dont on dépend arrive, les Fragments précédemment mis en cache sont automatiquement résolus
