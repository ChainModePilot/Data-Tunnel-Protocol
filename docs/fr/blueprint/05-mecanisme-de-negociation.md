# Chapitre 5 : Mécanisme de négociation

## 5.1 Principes de négociation

L'un des principes de conception fondamentaux de DTP est « la négociation d'abord » : toute transmission de données doit être basée sur des agreements négociés par les deux parties — il n'y a pas de « transmission nue ». Le mécanisme de négociation garantit :

- Le maître et l'esclave parviennent à un consensus explicite sur les paramètres de transmission avant le début du transfert de données
- Les paramètres de l'agreement peuvent être ajustés dynamiquement pendant la transmission
- L'une ou l'autre partie peut mettre fin proactivement à un agreement

## 5.2 Types de trames de négociation

DTP utilise deux types de trames pour effectuer la négociation :

### Trame de requête (Request_Frame)

Utilisée pour initier des requêtes de données ou ajuster les agreements de transmission, contenant les éléments suivants :

| Champ | Description |
|-------|-------------|
| requestId | Identifiant unique de la requête |
| requestorRole | Rôle du demandeur (master / slave) |
| requestType | Type de requête : collection / injection / adjustment / termination |
| targetAgreementId | ID de l'Agreement référencé lors d'un ajustement/terminaison |
| proposedParams | Paramètres d'agreement proposés |

### Trame de réponse (Response_Frame)

Utilisée pour répondre aux requêtes de données, contenant les éléments suivants :

| Champ | Description |
|-------|-------------|
| requestId | ID de la requête correspondante |
| result | Résultat de la négociation : accepted / rejected / counter_proposal |
| agreedParams | Paramètres finaux en cas d'acceptation ou de contre-proposition |
| agreementId | ID de l'Agreement généré lors de l'acceptation |
| rejectionReason | Raison du rejet |

## 5.3 Flux de négociation

### Négociation de collecte de données (initiée par le maître)

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

1. Le maître envoie une requête de collecte de données à l'esclave, spécifiant le type de données, le mode de transfert, la fréquence et d'autres paramètres
2. L'esclave répond via Response_Frame :
   - **Accepté** : accepte de transmettre les données selon les paramètres demandés
   - **Rejeté** : limité aux contraintes de conformité (par ex., politiques DLP de prévention de perte de données) ; doit inclure une raison de conformité
   - **Contre-proposition** : propose des paramètres modifiés

### Négociation d'injection de données (initiée par l'esclave)

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

1. L'esclave envoie une requête d'injection de données au maître, décrivant quelles données sont nécessaires
2. Le maître répond via Response_Frame :
   - **Accepté** : inclut la plage de données filtrée (jeu de données minimisé)
   - **Rejeté** : les données ne seront pas fournies
   - **Contre-proposition** : offre des données dans une plage ou un format différent

## 5.4 Paramètres de l'Agreement

Une fois que les deux parties parviennent à un consensus, un Agreement_ID unique est généré. Le contenu de l'agreement inclut :

| Paramètre | Type | Description |
|-----------|------|-------------|
| dataType | string | Identifiant du type de données |
| dataRange | string | Description de la plage de données |
| transferMode | enum | Mode de transfert : one_time / periodic / streaming |
| frequency | number \| null | Fréquence de transfert (Hz) ; null pour le mode ponctuel |
| validityPeriod | number | Période de validité (millisecondes) |
| priority | enum | Priorité : low / normal / high / critical |

## 5.5 Cycle de vie de l'Agreement

Un agreement passe par les états suivants :

```
negotiating ──▶ active ──▶ terminated
                  │
                  ▼
              suspended
```

- **negotiating** : négociation en cours
- **active** : l'agreement est en vigueur ; la transmission de données est en cours
- **suspended** : connexion interrompue ; l'agreement est en pause
- **terminated** : l'agreement est terminé

## 5.6 Ajustement dynamique

DTP prend en charge l'ajustement dynamique des paramètres d'un agreement existant pendant la transmission en envoyant un nouveau Request_Frame (avec requestType défini à `adjustment`).

Scénario typique : iFay demande initialement à une montre connectée de rapporter la fréquence cardiaque une fois par minute, mais en détectant que l'utilisateur a commencé à courir, ajuste dynamiquement l'agreement pour un rapport une fois par seconde.

## 5.7 Terminaison de l'Agreement

Un agreement est explicitement terminé en envoyant un Request_Frame (avec requestType défini à `termination`). Après la terminaison, la transmission de données sous cet agreement s'arrête immédiatement.

## 5.8 Agreements concurrents multiples

DTP prend en charge le maintien simultané de plusieurs agreements actifs au sein d'une même session. Le fait que plusieurs agreements soient transmis en série ou en parallèle dépend des capacités du protocole de transport sous-jacent.

Exemple : iFay maintient simultanément un agreement de collecte de données de fréquence cardiaque (une fois par seconde) et un agreement de collecte de données de nombre de pas (une fois par minute) avec une montre connectée ; les deux agreements fonctionnent indépendamment.
