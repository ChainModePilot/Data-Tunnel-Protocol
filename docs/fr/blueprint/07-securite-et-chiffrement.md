# Chapitre 7 : Sécurité et chiffrement

## 7.1 Conception du chiffrement de bout en bout

DTP implémente un chiffrement de bout en bout, garantissant que les données ne peuvent être volées ou altérées pendant la transmission, même lorsqu'elles transitent par des environnements intermédiaires non fiables (tels que l'environnement d'exécution FayGer).

Garantie fondamentale : **Seule l'instance iFay cible peut déchiffrer les données payload reçues ; l'environnement d'exécution FayGer ne peut pas accéder aux données en clair.**

Même lorsqu'iFay s'exécute sur une instance FayGer dans un cloud public, le fournisseur de services cloud ne peut pas lire les données de santé, les informations de localisation ou les relevés de consommation de l'utilisateur.

## 7.2 Portée du chiffrement

```
┌─────────────────────────────────────┐
│           Logical_Frame              │
├─────────────────────────────────────┤
│  Header — Transmis en clair          │
│  ┌─────────────────────────────────┐│
│  │ ...                             ││
│  │ encryptionMetadata — En clair   ││
│  │   algorithm: "AES-256-GCM"     ││
│  │   keyVersion: 3                ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  Payload — Transmis chiffré          │
│  ┌─────────────────────────────────┐│
│  │ ████████████████████████████    ││
│  │ ████████ Données chiffrées █████││
│  │ ████████████████████████████    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

- **Header** : transmis en clair ; contient les méta-informations nécessaires au routage et au traitement
- **Métadonnées de chiffrement** : transmises en clair ; contiennent l'identifiant de l'algorithme de chiffrement et le numéro de version de la clé afin que le récepteur puisse déterminer la méthode de déchiffrement
- **Payload** : transmis chiffré ; contient le contenu réel des données

## 7.3 Gestion des clés

DTP ne gère pas les clés lui-même ; il s'appuie plutôt sur les clés pré-négociées par CAP (Control Authorization Protocol) :

1. CAP effectue la vérification d'identité et l'échange de clés pendant la phase d'établissement de la connexion
2. DTP utilise les clés fournies par CAP pour le chiffrement/déchiffrement du Payload
3. Le numéro de version de la clé (keyVersion) identifie la clé actuellement utilisée

### Prérequis CAP

Avant de commencer la transmission de données, DTP **doit** vérifier que CAP a terminé le processus de vérification d'identité et d'échange de clés. Si l'échange de clés CAP n'est pas encore terminé, DTP_Engine refuse d'envoyer des données et renvoie une erreur « clé non prête » (KEY_NOT_READY).

## 7.4 Métadonnées de chiffrement

Le header de chaque LogicalFrame transporte des métadonnées de chiffrement :

| Champ | Description |
|-------|-------------|
| algorithm | Identifiant de l'algorithme de chiffrement, par ex., "AES-256-GCM" |
| keyVersion | Numéro de version de la clé, identifiant quelle version de la clé est utilisée |

Les métadonnées de chiffrement elles-mêmes ne sont pas chiffrées, garantissant que le récepteur peut déterminer les paramètres de déchiffrement avant le déchiffrement.

## 7.5 Cohérence aller-retour du chiffrement

DTP garantit la cohérence aller-retour du chiffrement :

- Chiffrer puis déchiffrer avec la **bonne clé** doit produire un Payload équivalent aux données originales
- Déchiffrer avec une **mauvaise clé** doit échouer et renvoyer une erreur DECRYPTION_FAILED

## 7.6 Déchiffrement côté terminal

Lorsque le terminal est le récepteur (scénario d'injection de données), DTP_Engine utilise la clé soumise par le terminal lors de la phase d'établissement de connexion CAP pour le déchiffrement.

## 7.7 Protection contre les menaces de sécurité

| Menace | Mesure de protection DTP |
|--------|--------------------------|
| Écoute par interception (man-in-the-middle) | Chiffrement de bout en bout du Payload ; les nœuds intermédiaires ne peuvent pas lire les données en clair |
| Espionnage par FayGer | FayGer ne peut voir que le Payload chiffré et ne peut pas le déchiffrer |
| Compromission de clé | Le mécanisme de numéro de version de clé prend en charge la rotation des clés |
| Usurpation d'identité | S'appuie sur le mécanisme de vérification d'identité de CAP |
| Attaques par rejeu | Numéros de séquence croissants de manière monotone + liaison de session |
