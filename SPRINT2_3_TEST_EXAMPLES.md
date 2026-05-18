# Tests effectués — Sprint 1, Sprint 2 & Sprint 3

Le tableau ci-dessous reprend les tests automatisés réalisés pour les Sprints 1, 2 et 3, dans un format proche de l’exemple fourni.

## Sprint 1 — Authentification et gestion d’utilisateur

À la fin du Sprint 1, nous avons procédé à la revue des fonctionnalités de base de la plateforme afin de vérifier le bon fonctionnement de l’authentification et de la gestion des utilisateurs. Cette phase a permis de valider l’accès à l’espace utilisateur, la création et la consultation des comptes, ainsi que la modification des données personnelles. Le tableau suivant présente les tests unitaires et les tests d’intégration effectués au cours de ce sprint.

### 2.4.1 Tests unitaires

Les tests unitaires du Sprint 1 ont permis de contrôler de manière isolée les services d’authentification et de gestion d’utilisateur. Ils vérifient notamment la génération du token, la validation du token, la consultation des comptes et la mise à jour des informations personnelles. Le tableau suivant présente les tests unitaires effectués au cours de ce sprint.

| Module                             | Opération                                     | Nombre de tests réussis | Nombre de tests échoués | Nombre de tests totaux |
| ---------------------------------- | --------------------------------------------- | ----------------------: | ----------------------: | ---------------------: |
| Authentification                   | Génération du token d’authentification        |                       1 |                       0 |                      1 |
| Authentification                   | Validation d’un token actif                   |                       1 |                       0 |                      1 |
| Gestion d’utilisateur              | Consultation d’un utilisateur par identifiant |                       1 |                       0 |                      1 |
| Gestion d’utilisateur              | Récupération du rôle d’un utilisateur         |                       1 |                       0 |                      1 |
| Gestion d’utilisateur              | Création d’un compte utilisateur              |                       2 |                       0 |                      2 |
| Gestion d’utilisateur              | Récupération de la liste des utilisateurs     |                       1 |                       0 |                      1 |
| Gestion d’utilisateur              | Mise à jour d’un utilisateur                  |                       1 |                       0 |                      1 |
| Gestion d’utilisateur              | Suppression d’un utilisateur                  |                       1 |                       0 |                      1 |
| Profil                             | Mise à jour des données personnelles          |                       1 |                       0 |                      1 |
| **Total tests unitaires Sprint 1** |                                               |                  **10** |                   **0** |                 **10** |

### 2.4.2 Tests d’intégration

Les tests d’intégration du Sprint 1 ont servi à vérifier la communication entre les différents services liés à l’authentification et à la gestion d’utilisateur. L’objectif était de s’assurer que l’utilisateur peut se connecter correctement, que les comptes sont bien persistés et que la modification du profil reste cohérente dans l’ensemble de l’application. Le tableau suivant présente les tests d’intégration effectués au cours de ce sprint.

| Module                                 | Opération                                               | Nombre de tests réussis | Nombre de tests échoués | Nombre de tests totaux |
| -------------------------------------- | ------------------------------------------------------- | ----------------------: | ----------------------: | ---------------------: |
| Authentification                       | Connexion avec identifiants corrects                    |                       1 |                       0 |                      1 |
| Authentification                       | Refus de connexion avec mot de passe incorrect          |                       1 |                       0 |                      1 |
| Gestion d’utilisateur                  | Création puis consultation d’un compte utilisateur      |                       1 |                       0 |                      1 |
| Profil                                 | Mise à jour du profil et vérification de la persistance |                       1 |                       0 |                      1 |
| **Total tests d’intégration Sprint 1** |                                                         |                   **4** |                   **0** |                  **4** |

### Problèmes rencontrés pendant le Sprint 1

Au cours de ce sprint, les principales difficultés étaient liées à la cohérence des données d’authentification entre les services et à l’initialisation correcte des comptes de test. En particulier, certaines vérifications échouaient au départ lorsque le compte utilisé pour la connexion n’existait pas encore dans la base de données ou lorsque le rôle de l’utilisateur n’était pas correctement renseigné. Après la correction des données de test et la mise en place des comptes adéquats, les scénarios du Sprint 1 ont été validés avec succès.

## Sprint 2 — Préinscription

À la fin du Sprint 2, nous avons procédé à la vérification des fonctionnalités liées à la préinscription afin de valider le bon déroulement du parcours candidat. Cette étape nous a permis de contrôler la création, la consultation et la modification d’une candidature, ainsi que les mécanismes de notification et de suivi des informations de score. Le tableau suivant présente les tests effectués au cours de ce sprint.

### 2.5.1 Tests unitaires

Les tests unitaires permettent de vérifier de manière isolée les règles métier du Sprint 2, notamment la création de candidature, la modification avant délai et la consultation des informations de suivi. Le tableau suivant présente les tests unitaires effectués au cours de ce sprint.

| Module                             | Opération                   | Nombre de tests réussis | Nombre de tests échoués | Nombre de tests totaux |
| ---------------------------------- | --------------------------- | ----------------------: | ----------------------: | ---------------------: |
| Préinscription                     | Création de candidature     |                       1 |                       0 |                      1 |
| Préinscription                     | Modification avant délai    |                       1 |                       0 |                      1 |
| Préinscription                     | Consultation de candidature |                       1 |                       0 |                      1 |
| Préinscription                     | Score et classement         |                       1 |                       0 |                      1 |
| **Total tests unitaires Sprint 2** |                             |                   **4** |                   **0** |                  **4** |

### 2.5.2 Tests d’intégration

Les tests d’intégration du Sprint 2 ont servi à vérifier l’interaction entre les services d’authentification, de candidature et de notification. L’objectif était de confirmer que les différentes parties de l’application communiquent correctement et que les réponses attendues sont bien retournées par l’API. Le tableau suivant présente les tests d’intégration effectués au cours de ce sprint.

| Module                                 | Opération                                                 | Nombre de tests réussis | Nombre de tests échoués | Nombre de tests totaux |
| -------------------------------------- | --------------------------------------------------------- | ----------------------: | ----------------------: | ---------------------: |
| Authentification                       | Vérification des commissions liées à l’utilisateur        |                       1 |                       0 |                      1 |
| Authentification                       | Contrôle des notifications liées au compte                |                       1 |                       0 |                      1 |
| Préinscription                         | Création puis consultation de candidature                 |                       1 |                       0 |                      1 |
| Préinscription                         | Déclenchement de notification lors d’un changement d’état |                       1 |                       0 |                      1 |
| **Total tests d’intégration Sprint 2** |                                                           |                   **4** |                   **0** |                  **4** |

### Problèmes rencontrés pendant le Sprint 2

Au cours de cette phase, nous avons rencontré un problème de sérialisation sur l’API de création de candidature : le champ formulaire était bien déclaré dans le serializer, mais il n’était pas inclus dans la liste des champs exposés. Cette incohérence provoquait une erreur lors de la réponse de création. Après correction du contrat du serializer et adaptation du test à la forme réelle du payload, les tests du sprint se sont exécutés correctement.

## Sprint 3 — Dépôt de dossier, présélection et sélection

À l’issue du Sprint 3, nous avons vérifié le dépôt du dossier numérique, l’ajustement avant expiration du délai, ainsi que les opérations de présélection et de sélection. Cette série de tests a permis de confirmer que les transitions de statut, la publication des listes et les traitements liés à l’inscription se déroulent comme prévu. Le tableau ci-dessous résume les tests exécutés pour ce sprint.

### 2.6.1 Tests unitaires

Les tests unitaires du Sprint 3 ont servi à contrôler les règles métier liées au dépôt du dossier, à l’ajustement avant délai et à la publication des listes. Ils permettent de vérifier chaque fonctionnalité indépendamment de l’interface et des autres services. Le tableau suivant présente les tests unitaires effectués au cours de ce sprint.

| Module                             | Opération                                     | Nombre de tests réussis | Nombre de tests échoués | Nombre de tests totaux |
| ---------------------------------- | --------------------------------------------- | ----------------------: | ----------------------: | ---------------------: |
| Dépôt de dossier                   | Dépôt du dossier numérique                    |                       1 |                       0 |                      1 |
| Dépôt de dossier                   | Ajustement avant délai                        |                       1 |                       0 |                      1 |
| Commission                         | Récupération des commissions de l’utilisateur |                       1 |                       0 |                      1 |
| Présélection                       | Publication de liste d’admission              |                       1 |                       0 |                      1 |
| **Total tests unitaires Sprint 3** |                                               |                   **4** |                   **0** |                  **4** |

### 2.6.2 Tests d’intégration

Les tests d’intégration du Sprint 3 ont permis de valider le fonctionnement combiné des services de dossier, de présélection et de sélection. L’objectif était de s’assurer que les changements de statut, la génération des listes et la gestion des inscriptions fonctionnent correctement ensemble. Le tableau suivant présente les tests d’intégration effectués au cours de ce sprint.

| Module                                 | Opération                                | Nombre de tests réussis | Nombre de tests échoués | Nombre de tests totaux |
| -------------------------------------- | ---------------------------------------- | ----------------------: | ----------------------: | ---------------------: |
| Dépôt de dossier                       | Validation du formulaire commission      |                       1 |                       0 |                      1 |
| Présélection                           | Génération de la liste principale        |                       1 |                       0 |                      1 |
| Présélection                           | Génération de la liste d’attente         |                       1 |                       0 |                      1 |
| Sélection                              | Mise à jour du classement et des statuts |                       1 |                       0 |                      1 |
| Sélection                              | Publication de la liste et notifications |                       1 |                       0 |                      1 |
| **Total tests d’intégration Sprint 3** |                                          |                   **5** |                   **0** |                  **5** |

### Problèmes rencontrés pendant le Sprint 3

Les principales difficultés observées concernaient la configuration des données de test et l’alignement des relations entre commission, candidature et liste d’admission. Au démarrage, certains scénarios échouaient à cause d’un rattachement de membre de commission mal initialisé ou d’un appel automatique vers un champ de sérialisation non exposé. Une fois ces incohérences corrigées, les scénarios de dépôt de dossier, d’ajustement et de publication de liste ont été validés avec succès.

## Remarque

Ces tests ont été automatisés côté backend avec `python manage.py test candidature_app.tests_sprint23 -v 2` et validés avec succès.
