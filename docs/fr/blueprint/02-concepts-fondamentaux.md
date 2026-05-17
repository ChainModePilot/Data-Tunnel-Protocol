# Chapitre 2 : Concepts fondamentaux

## 2.1 Modèle de relation maître-esclave

DTP possède une relation maître-esclave clairement définie :

- **Maître** : la personne physique (utilisateur) ou Fay (iFay / coFay) — le propriétaire ultime des données et le décideur
- **Esclave** : un terminal logiciel ou matériel — le producteur ou consommateur de données

### Contraintes clés

| Contrainte | Description | Exemple |
|------------|-------------|---------|
| Contrôleur unique | À un instant donné, un terminal ne peut avoir qu'un seul Fay qui l'« habite » | La montre connectée d'un utilisateur ne peut être contrôlée que par son propre iFay à un instant donné |
| Mécanisme d'observateur | Le Fay contrôleur peut inviter ou autoriser d'autres Fays à observer (accès en lecture seule) | L'iFay d'un utilisateur contrôle une caméra domestique intelligente tout en invitant le coFay d'un médecin de famille à observer le flux de données de suivi de santé |
| Droit de récupération du maître | Le maître a le droit de récupérer des données de l'esclave ; l'esclave ne peut pas refuser dans la plupart des cas | iFay demande l'historique de navigation d'un ordinateur portable d'entreprise ; l'agent DLP de l'ordinateur refuse la requête en raison de la politique de conformité de l'entreprise |
| Système de requête de l'esclave | Lorsque l'esclave demande une injection de données au maître, le maître a l'autorité décisionnelle complète | Une application de VTC demande les adresses du domicile et du bureau de l'utilisateur à iFay ; iFay détermine que l'utilisateur se rend au travail et ne fournit que l'adresse du bureau |
| Réutilisation multi-maîtres | Un esclave peut être réutilisé par plusieurs maîtres pendant différentes périodes | Une enceinte intelligente familiale partagée est habitée par l'iFay de la mère pendant la journée et l'iFay du père la nuit |

## 2.2 Modes de participation

DTP prend en charge deux modes de participation :

- **Contrôleur** : le Fay qui « habite » actuellement le terminal, avec un accès complet en lecture-écriture
- **Observateur** : un autre Fay invité ou autorisé par le contrôleur, avec un accès en lecture seule

Les observateurs ne peuvent recevoir que des copies en lecture seule du flux de données et ne peuvent pas initier de requêtes ni modifier d'agreements.

## 2.3 Agreement

Un Agreement est un contrat de transmission de données négocié entre le maître et l'esclave, définissant tous les paramètres du transfert de données :

- **Type/portée des données** : quelles données transmettre
- **Mode de transfert** : ponctuel (`one_time`), périodique (`periodic`) ou en flux continu (`streaming`)
- **Fréquence de transfert** : la fréquence à laquelle les données sont envoyées
- **Période de validité** : la durée pendant laquelle l'agreement est valide
- **Priorité** : basse (`low`), normale (`normal`), haute (`high`) ou critique (`critical`)

Toute transmission de données doit être basée sur un agreement négocié mutuellement — il n'y a pas de « transmission nue ».

## 2.4 Fragment de données

Un Fragment est l'unité de données dans DTP, avec les caractéristiques suivantes :

- **Identifiant globalement unique** (Fragment_ID)
- **Horodatage d'origine** (Origin_Timestamp) : le moment où les données ont été réellement produites, et non le moment de la transmission
- **Dépendances DAG** : relations avec d'autres Fragments
- **Affiliation à un agreement** : indique l'agreement associé via Agreement_ID
- **Métadonnées contextuelles** : informations contextuelles structurées

## 2.5 Dépendances en graphe acyclique dirigé (DAG)

Les Fragments expriment des relations de dépendance à travers des arêtes DAG, prenant en charge trois types de relations :

| Type de relation | Signification | Exemple |
|------------------|---------------|---------|
| `derived_from` | Dérivé de | Un Fragment « résumé quotidien du nombre de pas » est dérivé des Fragments individuels d'enregistrement de pas tout au long de la journée |
| `annotates` | Annote | Un Fragment de données météorologiques annote un Fragment de commande de livraison de repas, expliquant pourquoi l'utilisateur a commandé une boisson glacée pendant les hautes températures |
| `supersedes` | Remplace | Après qu'un utilisateur a mis à jour son adresse de livraison, le nouveau Fragment d'adresse remplace l'ancien Fragment d'adresse |

La structure DAG garantit que les relations sont établies au moment de la collecte des données, aidant iFay à comprendre la lignée évolutive et les relations causales des données.

## 2.6 Glossaire

| Terme | Définition |
|-------|------------|
| iFay | Individual Fay — un avatar IA personnel (jumeau numérique) lié à une personne physique spécifique (Human Prime) |
| coFay | Common Fay — une IA à rôle public (similaire à un Agent) |
| Fay | Terme générique pour les agents IA anthropomorphes |
| FayGer | Le conteneur/environnement d'exécution pour Fay (similaire à Docker/JRE) ; considéré comme un « espace public » et ne devant pas accéder aux données en clair |
| Human Prime | La personne physique à laquelle un iFay est lié |
| Faying | L'état dans lequel un iFay est connecté/appairé avec son Human Prime |
| Personal Data Heap | Le module de gestion de données privées d'iFay, stockant les données dans de multiples formats (le « journal intime » du Human Prime) |
| Sensor | Le « système nerveux » d'iFay construit sur CAP + DTP, recevant les flux de données |
| Device Driver Hub | La couche hub de pilotes intégrant les pilotes de périphériques |
| DTP_Engine | Le moteur de traitement central du protocole DTP, responsable de l'encodage, du décodage, du chiffrement, du déchiffrement et de la gestion de la transmission des trames |
