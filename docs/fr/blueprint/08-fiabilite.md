# Chapitre 8 : Fiabilité

## 8.1 Mécanisme de reprise

DTP implémente un mécanisme de reprise basé sur les numéros de séquence, garantissant une transmission complète des données dans des environnements réseau instables.

Objectif principal : lorsque la transmission reprend après une interruption de connexion, il n'est pas nécessaire de renvoyer les données qui ont déjà été reçues avec succès.

### Fonctionnement

```
Sender                              Receiver
  │                                   │
  │── Fragment (seq=1) ──────────────▶│ ✓ Reçu
  │── Fragment (seq=2) ──────────────▶│ ✓ Reçu
  │── Fragment (seq=3) ──────────────▶│ ✓ Reçu
  │── Fragment (seq=4) ────── ✗ ──────│ Connexion perdue
  │                                   │
  │     ... Connexion restaurée ...    │
  │                                   │
  │◀── Signaler le seq le plus élevé reçu (3)│
  │                                   │
  │── Fragment (seq=4) ──────────────▶│ Reprise depuis le point d'interruption
  │── Fragment (seq=5) ──────────────▶│
  │                                   │
```

### Responsabilités de l'émetteur

1. Attribuer un numéro de séquence croissant de manière monotone à chaque Fragment
2. Mettre en cache localement les Fragments qui n'ont pas encore été acquittés par le récepteur
3. À la réception de l'accusé de réception, supprimer les Fragments acquittés du cache
4. Après la récupération de la connexion, reprendre la transmission à partir du Fragment suivant le numéro de séquence le plus élevé signalé par le récepteur

### Responsabilités du récepteur

1. Suivre le numéro de séquence le plus élevé reçu avec succès
2. À la récupération de la connexion, signaler le numéro de séquence le plus élevé reçu avec succès à l'émetteur

## 8.2 Gestion du cache

L'émetteur maintient un cache local des Fragments non acquittés :

- Chaque Fragment envoyé mais pas encore acquitté est conservé dans le cache
- À la réception de l'accusé de réception, les Fragments acquittés sont supprimés du cache
- Le cache a une limite de capacité

### Gestion du cache plein

Lorsque le cache local de l'émetteur atteint sa limite de capacité :

1. Suspendre l'envoi de nouveaux Fragments
2. Notifier l'application de couche supérieure que le cache est plein
3. Attendre l'accusé de réception du récepteur pour libérer de l'espace dans le cache avant de reprendre la transmission

## 8.3 Gestion des sessions

### Établissement de session

Après que CAP a terminé la vérification d'identité et l'échange de clés, DTP_Engine établit une session DTP et génère un identifiant de session unique (Session_ID).

### Maintenance de l'état de session

DTP_Engine maintient l'état de transmission bidirectionnel au sein de la session :

| Élément d'état | Description |
|----------------|-------------|
| currentSequenceNumber | Numéro de séquence actuel |
| highestAcknowledgedSequenceNumber | Numéro de séquence le plus élevé acquitté |
| unacknowledgedFragmentCache | Cache des Fragments non acquittés |
| activeAgreements | Liste des agreements actifs |

Chaque direction (collecte et injection) maintient un état de transmission indépendant.

### Persistance de session

Lorsque la connexion de transport sous-jacente est rompue, DTP_Engine persiste l'état de session (incluant tous les agreements actifs) dans le stockage pour prendre en charge la récupération ultérieure de la connexion.

### Récupération de session

Après que la connexion est restaurée et que la re-vérification CAP est réussie, DTP_Engine récupère l'état de session précédent (incluant les agreements actifs) et reprend la transmission.

Flux de récupération :

1. La connexion sous-jacente est rétablie
2. CAP re-vérifie l'identité
3. DTP_Engine récupère l'état de session depuis le stockage persistant
4. Le récepteur signale le numéro de séquence le plus élevé reçu
5. L'émetteur reprend la transmission depuis le point d'interruption

### Timeout de session

Si une session reste inactive au-delà du seuil de timeout configuré par le protocole, DTP_Engine ferme la session et libère les ressources associées. Une nouvelle session doit être établie après le timeout.

## 8.4 Mécanisme de retransmission

Lorsque l'émetteur ne reçoit pas d'accusé de réception du récepteur dans le délai de timeout de retransmission configuré par le protocole, il retransmet automatiquement les Fragments non acquittés.

Stratégie de retransmission :

1. Attendre la période de timeout configurée
2. Retransmettre les Fragments non acquittés après le timeout
3. Si le nombre de retransmissions dépasse le seuil, notifier l'application de couche supérieure de l'échec de la transmission

## 8.5 Scénarios typiques

### Scénario 1 : Tunnel de métro

Le téléphone d'un utilisateur perd la connectivité réseau dans un tunnel de métro, ayant téléchargé 300 des 500 enregistrements de données d'exercice. Après être sorti du tunnel et avoir restauré la connectivité, DTP reprend la transmission à partir de l'enregistrement 301 sans renvoyer les 300 premiers.

### Scénario 2 : Portée Bluetooth dépassée

La montre connectée d'un utilisateur perd sa connexion Bluetooth avec le téléphone en raison d'une distance excessive. Lorsque l'utilisateur revient à proximité, la connexion se rétablit automatiquement et la montre continue de télécharger les données de fréquence cardiaque accumulées pendant la déconnexion.

### Scénario 3 : Redémarrage du serveur

L'instance FayGer hébergeant iFay redémarre ; l'état de la session DTP a été persisté. Après le redémarrage, la session est récupérée et la réception des données depuis le terminal continue depuis le point d'interruption.
