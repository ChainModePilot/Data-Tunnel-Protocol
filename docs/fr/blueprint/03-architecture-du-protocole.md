# Chapitre 3 : Architecture du protocole

## 3.1 Couches du protocole

DTP adopte une architecture en couches, de haut en bas :

```
┌─────────────────────────────────────────────┐
│           Couche applicative                 │
│   iFay / coFay / Personal Data Heap          │
│   Applications terminales (Logiciel / Matériel) │
├─────────────────────────────────────────────┤
│           Couche protocole DTP               │
│   DTP_Master Engine / DTP_Slave Engine       │
│   ┌───────────────────────────────────────┐ │
│   │ Agreement Manager                      │ │
│   │ Frame Codec                            │ │
│   │ DAG Manager                            │ │
│   │ Encryption Module                      │ │
│   │ Session Manager                        │ │
│   │ Resume Manager                         │ │
│   └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│           Couche adaptateur                  │
│   Transport_Adapter                          │
├─────────────────────────────────────────────┤
│           Couche transport                   │
│   BLE / WebSocket / TCP / RTSP / ...         │
└─────────────────────────────────────────────┘
```

### Principes de conception

- **Agnosticisme du transport** : grâce à l'abstraction Transport_Adapter, la logique centrale de DTP est découplée des protocoles de transport spécifiques
- **Négociation d'abord** : toute transmission de données doit être basée sur des agreements négociés par les deux parties — pas de « transmission nue »
- **Souveraineté des données** : le maître a l'autorité décisionnelle finale sur les flux de données ; l'esclave est le producteur ou consommateur de données
- **Chiffrement de bout en bout** : le Payload est chiffré en transit ; l'environnement d'exécution FayGer ne peut pas accéder aux données en clair
- **Préservation du contexte** : chaque Fragment transporte des métadonnées contextuelles structurées, garantissant que le contexte n'est pas perdu lors de la collecte des données
- **Récupérabilité** : le mécanisme de reprise basé sur les numéros de séquence prend en charge la récupération transparente après les interruptions de connexion

## 3.2 Composants principaux

### DTP_Engine

Le moteur de traitement central du protocole DTP, disponible en deux variantes :

- **DTP_Master** : s'exécute côté Fay ; détient le droit d'initier la collecte de données et de prendre les décisions d'injection de données
- **DTP_Slave** : s'exécute côté terminal ; responsable de la production de données et des requêtes d'injection

Les deux partagent des capacités fondamentales telles que le codec de trames, le chiffrement et la gestion du DAG, mais diffèrent dans les permissions de négociation et la direction du flux de données.

### Transport_Adapter

L'interface abstraite pour les protocoles de transport sous-jacents. DTP_Engine communique avec les protocoles de transport spécifiques via cette interface, réalisant l'agnosticisme du transport. Les protocoles de transport pris en charge incluent BLE, WebSocket, TCP, RTSP et d'autres.

Lorsque la connexion de transport sous-jacente est rompue, Transport_Adapter signale un événement de changement d'état de connexion à DTP_Engine, déclenchant la suspension de session et le processus de reprise.

### Agreement Manager

Gère le cycle de vie complet des agreements :

1. **Création** : initie une requête de négociation
2. **Négociation** : traite les requêtes et les réponses
3. **Activation** : génère un Agreement_ID une fois que les deux parties parviennent à un consensus
4. **Ajustement dynamique** : modifie les paramètres de l'agreement pendant la transmission
5. **Terminaison** : met fin à un agreement via une directive d'arrêt

### Frame Codec

Responsable de la sérialisation (encodage en binaire) et de la désérialisation (décodage depuis le binaire) des Logical_Frame, ainsi que de la sortie formatée (Pretty Print). Garantit que les trames sont correctement transmises entre différentes plateformes.

### DAG Manager

Gère les relations de dépendance en graphe acyclique dirigé entre les Fragments :

- Détection de cycles : empêche la formation de dépendances circulaires
- Résolution des dépendances : gère les cas où les cibles de dépendance ne sont pas encore arrivées
- Requêtes de relations : interroge les dépendances et les dépendants d'un Fragment

### Encryption Module

Responsable du chiffrement et du déchiffrement de bout en bout des Payloads en utilisant des clés pré-négociées par CAP. Garantit que l'environnement d'exécution FayGer ne peut pas accéder aux données en clair.

### Session Manager

Gère le cycle de vie des sessions DTP :

- Création et fermeture de session
- Persistance et récupération de l'état
- Détection de timeout et libération des ressources

### Resume Manager

Gère le mécanisme de reprise basé sur les numéros de séquence :

- Gestion du cache de Fragments
- Suivi des numéros de séquence
- Coordination de la récupération au point d'interruption

## 3.3 Machine à états de DTP_Engine

Les états opérationnels de DTP_Engine suivent cette machine à états :

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
    ┌───────┐      │  ┌──────────────┐    ┌────────────────┐  │
    │ Idle  │──────┼─▶│WaitingForCAP │───▶│SessionEstablished│ │
    │       │◀─────┼──│              │◀───│                │  │
    └───────┘      │  └──────────────┘    └───────┬────────┘  │
        ▲          │                              │            │
        │          │                              ▼            │
        │          │                     ┌─────────────┐       │
        │          │                     │ Negotiating │       │
        │          │                     └──────┬──────┘       │
        │          │                            │              │
        │          │                            ▼              │
        │          │                    ┌──────────────┐       │
        │          │                    │ Transmitting │       │
        │          │                    └───────┬──────┘       │
        │          │                            │              │
        │          │                            ▼              │
        │          │  ┌──────────┐      ┌─────────────┐       │
        └──────────┼──│ Resuming │◀─────│  Suspended  │       │
                   │  └──────────┘      └─────────────┘       │
                   └──────────────────────────────────────────┘
```

Descriptions des transitions d'état :

| État actuel | Événement déclencheur | État cible |
|-------------|----------------------|------------|
| Idle | Requête de connexion reçue | WaitingForCAP |
| WaitingForCAP | Vérification CAP + échange de clés terminé | SessionEstablished |
| WaitingForCAP | Échec / timeout CAP | Idle |
| SessionEstablished | Request_Frame initié ou reçu | Negotiating |
| SessionEstablished | Fermeture de session par timeout | Idle |
| Negotiating | Agreement atteint | Transmitting |
| Negotiating | Échec / rejet de la négociation | SessionEstablished |
| Transmitting | Transmission continue de Fragments | Transmitting |
| Transmitting | Ajustement dynamique de l'agreement | Negotiating |
| Transmitting | Connexion rompue | Suspended |
| Transmitting | Agreement terminé (aucun autre agreement actif) | SessionEstablished |
| Suspended | Connexion restaurée + re-vérification CAP | Resuming |
| Suspended | Timeout de session | Idle |
| Resuming | Handshake de reprise terminé | Transmitting |
| Resuming | Échec de la récupération | Idle |

## 3.4 Séquence d'interaction maître-esclave

Une interaction DTP complète se compose de cinq phases :

**Phase 1 : Pré-traitement CAP**
- CAP effectue la vérification d'identité et l'échange de clés

**Phase 2 : Établissement de la session DTP**
- Le maître initie l'établissement de session avec l'esclave, générant un Session_ID

**Phase 3a : Négociation de collecte de données (initiée par le maître)**
- Le maître envoie un Request_Frame (requête de collecte de données)
- L'esclave répond avec un Response_Frame (accepté / rejeté / contre-proposition)
- L'agreement est atteint, générant un Agreement_ID

**Phase 3b : Négociation d'injection de données (initiée par l'esclave)**
- L'esclave envoie un Request_Frame (requête d'injection de données)
- Le maître répond avec un Response_Frame (accepté / rejeté / contre-proposition)
- L'agreement est atteint, générant un Agreement_ID

**Phase 4 : Transmission de données**
- Esclave → Maître : Fragment (collecte de données, portant l'Agreement_ID)
- Maître → Esclave : Fragment (injection de données, portant l'Agreement_ID)

**Phase 5 : Interruption et récupération de connexion**
- Connexion rompue → Rétablir la connexion (re-vérification CAP) → Signaler le numéro de séquence le plus élevé reçu → Reprendre la transmission depuis le point d'interruption
