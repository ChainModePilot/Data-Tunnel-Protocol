# Chapitre 10 : Gestion des versions

## 10.1 Format du numéro de version

DTP utilise le versionnement sémantique avec un numéro de version majeure et un numéro de version mineure :

```
{ major: number, minor: number }
```

Le header de chaque LogicalFrame inclut un champ de numéro de version du protocole qui identifie la version du protocole utilisée par cette trame.

## 10.2 Règles de compatibilité des versions

DTP_Engine prend en charge le traitement simultané des formats LogicalFrame de la **version actuelle** et de la **version majeure précédente**.

| Version de la trame reçue | Traitement |
|---------------------------|------------|
| Version actuelle | Traitement normal |
| Version majeure précédente | Traitement compatible (rétrocompatible) |
| Version supérieure | Envoyer une notification d'incompatibilité de version |
| Version inférieure (au-delà de la plage de compatibilité) | Envoyer une notification d'incompatibilité de version |

## 10.3 Gestion de l'incompatibilité de version

Lorsque le récepteur reçoit un LogicalFrame dont le numéro de version du protocole dans le header est supérieur à sa version prise en charge :

1. Ne pas traiter la trame
2. Envoyer une notification d'incompatibilité de version (VERSION_INCOMPATIBLE, 7001) à l'émetteur
3. Inclure le numéro de version le plus élevé pris en charge par le récepteur dans la notification

À la réception d'une notification d'incompatibilité de version, l'émetteur peut :
- Rétrograder vers la version prise en charge par le récepteur et renvoyer
- Ou notifier l'application de couche supérieure de l'incompatibilité de version

## 10.4 Stratégie d'évolution du protocole

La gestion des versions de DTP assure la rétrocompatibilité à mesure que le protocole évolue :

- **Mise à jour de version mineure** : ajoute de nouveaux champs ou fonctionnalités sans casser l'analyse des formats de trame existants
- **Mise à jour de version majeure** : peut modifier le format de trame, mais maintient la compatibilité avec la version majeure précédente

Cela signifie que les terminaux et Fay n'ont pas besoin d'être mis à jour simultanément — tant que la différence de version est d'une version majeure au maximum, les deux parties peuvent communiquer normalement.
