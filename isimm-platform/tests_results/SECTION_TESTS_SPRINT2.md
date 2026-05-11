# Tests effectues - Sprint 2

A la fin du sprint 2, nous procedons a la revue des taches de finalisation. Cette etape vise a presenter l'avancement du projet et a verifier si les objectifs fixes ont ete atteints. Les tests d'application jouent un role crucial pour garantir le bon fonctionnement de la plateforme.

## Tableau des tests effectues

| Module         | Operations                                          | Nombre de tests reussis | Nombre de tests echoues | Nombre de tests totaux |
| -------------- | --------------------------------------------------- | ----------------------: | ----------------------: | ---------------------: |
| Integration    | Upload Document Simple                              |                       1 |                       0 |                      1 |
| Integration    | Upload Multiple Documents                           |                       1 |                       0 |                      1 |
| Integration    | Consulter Dossier                                   |                       1 |                       0 |                      1 |
| Integration    | Soumission Dossier Incomplet                        |                       1 |                       0 |                      1 |
| Integration    | Soumission Dossier Complet                          |                       1 |                       0 |                      1 |
| Integration    | Suppression Document                                |                       1 |                       0 |                      1 |
| Integration    | Validation Format Fichier                           |                       1 |                       0 |                      1 |
| Integration    | Limite Taille Fichier                               |                       1 |                       0 |                      1 |
| Integration    | Depassement Delai Depot                             |                       1 |                       0 |                      1 |
| Integration    | Liste Mes Dossiers                                  |                       1 |                       0 |                      1 |
| Unitaire       | Modeles, serializers, permissions et logique metier |                      27 |                       0 |                     27 |
| Total Sprint 2 | Tous tests confondus                                |                      37 |                       0 |                     37 |

## Les problemes rencontres

Parmi les erreurs rencontrees, un probleme recurrent concernait l'incoherence entre les routes API, les permissions et les donnees de test simulees. Cette incoherence provoquait des echecs de tests (404, 403, collisions de checksum), et pouvait invalider certaines assertions metier.

## Solution detaillee pour corriger le probleme

La solution a consiste a:

1. Corriger l'exposition des routes de depot de dossier.
2. Aligner les roles autorises avec les profils fonctionnels attendus.
3. Stabiliser l'execution asynchrone en mode test (Celery en mode eager).
4. Corriger la logique de checksum pour eviter les collisions de documents.
5. Harmoniser les donnees de test pour garantir des assertions coherentes.

Ces corrections ont permis de valider le comportement reel du service et d'atteindre un taux de reussite de 100% sur le sprint 2.
