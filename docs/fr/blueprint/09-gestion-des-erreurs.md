# Chapitre 9 : Gestion des erreurs

## 9.1 Modèle de gestion des erreurs

La gestion des erreurs de DTP suit un modèle en trois phases « Détecter-Notifier-Récupérer » :

1. **Détecter** : identifier les conditions anormales
2. **Notifier** : envoyer les informations d'erreur au pair distant ou à la couche supérieure
3. **Récupérer** : prendre des mesures de récupération en fonction du type d'erreur

## 9.2 Système de codes d'erreur

DTP définit un code d'erreur unique pour chaque type d'erreur, réparti en huit plages par module fonctionnel :

| Catégorie d'erreur | Plage de codes | Stratégie de traitement |
|--------------------|----------------|-------------------------|
| Erreurs de traitement de trame | 1xxx | Rejeter la trame + notifier l'émetteur + journaliser |
| Erreurs de chiffrement | 2xxx | Rejeter la trame + notifier l'émetteur + peut déclencher une renégociation de clé |
| Erreurs d'Agreement | 3xxx | Rejeter le Fragment + notifier l'émetteur + peut déclencher une renégociation |
| Erreurs DAG | 4xxx | Rejeter le Fragment + notifier l'émetteur, ou mettre en cache et attendre |
| Erreurs de session | 5xxx | Tenter la récupération de session + en cas d'échec, fermer et notifier la couche supérieure |
| Erreurs de reprise | 6xxx | Suspendre l'envoi + notifier l'application de couche supérieure |
| Erreurs de version | 7xxx | Envoyer une notification d'incompatibilité de version + tenter une rétrogradation |
| Erreurs de permission | 8xxx | Rejeter l'opération + notifier le demandeur |

## 9.3 Référence des codes d'erreur

### Erreurs de traitement de trame (1xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 1001 | FRAME_DESERIALIZATION_FAILED | Échec de la désérialisation de la trame |
| 1002 | FRAME_INVALID_FORMAT | Format de trame invalide |

### Erreurs de chiffrement (2xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 2001 | DECRYPTION_FAILED | Échec du déchiffrement du Payload |
| 2002 | KEY_NOT_READY | Clé non prête (CAP non terminé) |

### Erreurs d'Agreement (3xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 3001 | AGREEMENT_NOT_FOUND | Agreement non trouvé |
| 3002 | AGREEMENT_EXPIRED | Agreement expiré |
| 3003 | AGREEMENT_NEGOTIATION_FAILED | Échec de la négociation de l'Agreement |

### Erreurs DAG (4xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 4001 | DAG_CYCLE_DETECTED | Cycle DAG détecté |
| 4002 | DAG_DEPENDENCY_UNRESOLVED | Dépendance DAG non résolue |

### Erreurs de session (5xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 5001 | SESSION_NOT_FOUND | Session non trouvée |
| 5002 | SESSION_TIMEOUT | Timeout de session |
| 5003 | SESSION_RESTORE_FAILED | Échec de la restauration de session |

### Erreurs de reprise (6xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 6001 | BUFFER_FULL | Cache plein |
| 6002 | RETRANSMISSION_TIMEOUT | Timeout de retransmission |

### Erreurs de version (7xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 7001 | VERSION_INCOMPATIBLE | Version incompatible |

### Erreurs de permission (8xxx)

| Code d'erreur | Nom | Description |
|---------------|-----|-------------|
| 8001 | PERMISSION_DENIED | Permission refusée |
| 8002 | OBSERVER_WRITE_DENIED | Opération d'écriture de l'observateur refusée |

## 9.4 Mécanisme de notification d'erreur

Les notifications d'erreur sont transmises via des trames de contrôle (Control Frames), contenant les informations suivantes :

| Champ | Description |
|-------|-------------|
| errorCode | Code d'erreur |
| errorMessage | Message de description de l'erreur |
| relatedFrameId | ID de la trame ayant déclenché l'erreur (optionnel) |
| relatedAgreementId | ID de l'Agreement associé (optionnel) |
| details | Détails supplémentaires (optionnel) |

## 9.5 Scénarios d'erreur clés

### Échec de désérialisation

Lorsqu'un LogicalFrame reçu ne peut pas être correctement désérialisé :
1. Rejeter la trame
2. Envoyer une notification d'erreur FRAME_DESERIALIZATION_FAILED (1001) à l'émetteur

### Échec de déchiffrement

Lorsque le payload d'un LogicalFrame reçu ne peut pas être correctement déchiffré :
1. Rejeter la trame
2. Envoyer une notification d'erreur DECRYPTION_FAILED (2001) à l'émetteur
3. Si les échecs consécutifs dépassent le seuil, déclencher une renégociation de clé CAP

### Détection de cycle DAG

Lorsque les relations de dépendance déclarées d'un Fragment formeraient un cycle dans le DAG :
1. Rejeter le Fragment
2. Renvoyer une erreur DAG_CYCLE_DETECTED (4001)

### Agreement inconnu

Lorsqu'un Fragment référence un Agreement_ID qui n'existe pas chez le récepteur :
1. Rejeter le Fragment
2. Renvoyer une erreur AGREEMENT_NOT_FOUND (3001)

### Clé non prête

Lorsqu'une tentative d'envoi de données est effectuée mais que l'échange de clés CAP n'est pas encore terminé :
1. Refuser l'envoi
2. Renvoyer une erreur KEY_NOT_READY (2002) à l'appelant de couche supérieure

### Cache plein

Lorsque le cache de Fragments non acquittés de l'émetteur atteint sa limite de capacité :
1. Suspendre l'envoi de nouveaux Fragments
2. Envoyer une notification BUFFER_FULL (6001) à l'application de couche supérieure

### Violation de privilège d'observateur

Lorsqu'un observateur tente d'initier une requête ou de modifier un agreement :
1. Rejeter l'opération
2. Renvoyer une erreur OBSERVER_WRITE_DENIED (8002)
