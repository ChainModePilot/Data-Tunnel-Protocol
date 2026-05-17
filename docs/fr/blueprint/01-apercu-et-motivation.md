# Chapitre 1 : Aperçu et motivation

## 1.1 Qu'est-ce que le Data Tunnel Protocol

Le Data Tunnel Protocol (DTP) est l'un des six protocoles fondamentaux de l'écosystème iFay. Il s'agit d'un **protocole de canal de transmission de données basé sur la négociation**, responsable de la collecte et de l'injection bidirectionnelles de données entre les terminaux et Fay.

En tant que protocole de couche applicative, DTP s'appuie sur les protocoles de transport existants (BLE, RTSP, WebSocket, TCP, etc.). Il est agnostique au mécanisme de transport sous-jacent et ne définit que « quoi transmettre, comment l'organiser, comment négocier et comment garantir la livraison ».

## 1.2 Motivation du protocole : souveraineté des données

Dans le modèle traditionnel, les applications collectent indépendamment les données comportementales des utilisateurs pour des fonctionnalités telles que les recommandations, et les données appartiennent à la plateforme. Les utilisateurs n'ont aucun contrôle sur leurs propres données et ne peuvent pas décider quelles données peuvent être utilisées par qui.

La proposition de valeur fondamentale de DTP est la **souveraineté des données** : à l'ère de l'IA, les données personnelles doivent appartenir à l'individu (gérées par iFay au sein du Personal Data Heap), plutôt que d'être dispersées entre les différents fournisseurs d'applications.

Flux de données selon le modèle DTP :

1. Toutes les données des terminaux sont collectées via DTP dans le Personal Data Heap d'iFay
2. Lorsqu'une application terminale a besoin de données personnalisées, elle soumet une requête à iFay
3. iFay juge — comme le ferait un humain — quelles informations il est disposé à fournir et dans quelle mesure, renvoyant un jeu de données filtré et minimisé
4. La souveraineté des données reste toujours entre les mains de l'utilisateur (Human Prime)

## 1.3 Deux flux de données fondamentaux

DTP implémente deux flux de données fondamentaux :

- **Collecte de données (Terminal → Fay)** : stocke de manière persistante les données produites par le terminal dans le Personal Data Heap d'iFay, assurant la gestion des données
- **Injection de données (Fay → Terminal)** : iFay fournit temporairement un jeu de données filtré et évalué, minimisé, à l'application terminale, permettant des services personnalisés sans compromettre la vie privée

## 1.4 Données contextualisées

Les données peuvent perdre leur signification lorsqu'elles sont séparées de leur contexte d'origine. Par exemple :

- Un utilisateur commande une soupe de haricots mungo glacée sur une application de livraison. Si la température ambiante de 32°C est enregistrée simultanément, cela indique que l'utilisateur a choisi une boisson froide à cause de la chaleur
- Si la température est de 12°C, cela indique que l'utilisateur a une préférence pour les boissons froides

DTP transporte des métadonnées contextuelles au niveau du protocole, garantissant que le contexte est capturé au moment de la collecte des données et évitant la difficulté de le reconstruire après coup. Chaque Fragment de données transporte des métadonnées contextuelles structurées, incluant le type de données, l'identifiant de la source, l'environnement de collecte et d'autres informations.

## 1.5 Coordination avec CAP

DTP fonctionne en coordination avec le Control Authorization Protocol (CAP) :

- **CAP** gère l'autorisation de connexion, la vérification d'identité et l'échange de clés
- **DTP** gère la transmission effective du flux de données basée sur la négociation

Ensemble, ils permettent la capacité de « prise de contrôle directe du client » sans nécessiter d'interaction basée sur l'interface utilisateur. DTP ne commence la transmission de données qu'après que CAP a terminé la vérification d'identité et l'échange de clés, garantissant que les deux parties communicantes disposent d'identités de confiance et de clés utilisables.
