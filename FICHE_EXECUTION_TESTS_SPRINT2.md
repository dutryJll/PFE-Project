# Fiche d'Execution Tests - Sprint 2

Projet: Plateforme ISIMM
Date de test: \_**\_ / \_\_** / **\_\_**
Testeur: ********\_\_\_\_********
Version build: ********\_\_\_\_********
Environnement: ********\_\_\_\_********

## Legende Statut

- PASS: Conforme
- FAIL: Non conforme
- BLOCKED: Test bloque (prerequis manquant)
- N/A: Non applicable

## Checklist Pre-Demarrage

- [ ] Auth Service actif (8001)
- [ ] User Service actif (8002)
- [ ] Candidature Service actif (8003)
- [ ] Frontend actif (4200)
- [ ] Compte admin disponible
- [ ] Compte responsable commission disponible
- [ ] Comptes candidats de test disponibles

---

## US1 - Candidat postule a un master ou a un concours ingenieur

| ID test | Preconditions                                | Etapes                                                                         | Attendu                                                    | Obtenu | Statut |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------ | ------ |
| US1-T01 | Candidat connecte, parcours Master ouvert    | Aller page candidature -> choisir Master -> remplir formulaire -> soumettre    | Candidature creee + numero unique + statut initial visible |        |        |
| US1-T02 | Candidat connecte, parcours Ingenieur ouvert | Aller page candidature -> choisir Ingenieur -> remplir formulaire -> soumettre | Candidature creee + numero unique + statut initial visible |        |        |
| US1-T03 | Candidat connecte, parcours ferme            | Tenter de postuler                                                             | Blocage avec message clair                                 |        |        |

---

## US2 - Candidat modifie sa candidature avant expiration

| ID test | Preconditions                           | Etapes                                              | Attendu                                         | Obtenu | Statut |
| ------- | --------------------------------------- | --------------------------------------------------- | ----------------------------------------------- | ------ | ------ |
| US2-T01 | Candidature existante, delai non expire | Ouvrir candidature -> modifier infos -> enregistrer | Modifications sauvegardees et visibles          |        |        |
| US2-T02 | Candidature existante, delai expire     | Ouvrir candidature -> tenter modification           | Modification refusee + message de delai depasse |        |        |

---

## US3 - Candidat consulte l'etat de sa candidature

| ID test | Preconditions                  | Etapes                                                    | Attendu                                | Obtenu | Statut |
| ------- | ------------------------------ | --------------------------------------------------------- | -------------------------------------- | ------ | ------ |
| US3-T01 | Candidature existante          | Ouvrir espace candidat -> consulter l'etat                | Statut affiche correctement            |        |        |
| US3-T02 | Statut modifie cote commission | Changer statut cote commission -> recharger cote candidat | Statut candidat mis a jour et coherent |        |        |

---

## US4 - Notifications email lors des changements d'etat

| ID test | Preconditions                                  | Etapes                                                    | Attendu                                 | Obtenu | Statut |
| ------- | ---------------------------------------------- | --------------------------------------------------------- | --------------------------------------- | ------ | ------ |
| US4-T01 | Email candidat valide, service email configure | Changer statut candidature (ex: soumis -> preselectionne) | Email recu avec nouveau statut          |        |        |
| US4-T02 | Candidature avec 2 transitions                 | Appliquer 2 changements de statut                         | 1 email par changement, contenu correct |        |        |
| US4-T03 | Adresse email invalide (test)                  | Changer statut                                            | Erreur tracee/loggee, app ne plante pas |        |        |

---

## US5 - Candidat consulte score et classement

| ID test | Preconditions                        | Etapes                                    | Attendu                                | Obtenu | Statut |
| ------- | ------------------------------------ | ----------------------------------------- | -------------------------------------- | ------ | ------ |
| US5-T01 | Evaluation effectuee cote commission | Ouvrir resultats cote candidat            | Score et classement visibles           |        |        |
| US5-T02 | Score mis a jour cote commission     | Modifier score -> recharger cote candidat | Valeurs score/classement synchronisees |        |        |

---

## US6 - Candidat preselectionne depose son dossier dans le delai

| ID test | Preconditions                              | Etapes                                         | Attendu                                           | Obtenu | Statut |
| ------- | ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------- | ------ | ------ |
| US6-T01 | Candidat preselectionne, delai depot actif | Deposer tous documents requis -> soumettre     | Depot accepte + statut dossier mis a jour         |        |        |
| US6-T02 | Delai depot expire                         | Tenter depot dossier                           | Depot refuse + message explicite                  |        |        |
| US6-T03 | Dossier incomplet                          | Soumettre sans tous les documents obligatoires | Blocage + message indiquant les pieces manquantes |        |        |

---

## US7 - Candidat preselectionne ajuste son dossier avant expiration

| ID test | Preconditions                         | Etapes                                      | Attendu                                               | Obtenu | Statut |
| ------- | ------------------------------------- | ------------------------------------------- | ----------------------------------------------------- | ------ | ------ |
| US7-T01 | Dossier deja depose, delai non expire | Modifier/remplacer un document -> soumettre | Ajustement accepte + nouvelle version prise en compte |        |        |
| US7-T02 | Dossier deja depose, delai expire     | Tenter ajustement                           | Ajustement refuse + message de delai depasse          |        |        |

---

## Cas Transverses (Robustesse)

| ID test | Preconditions                   | Etapes                                    | Attendu                                      | Obtenu | Statut |
| ------- | ------------------------------- | ----------------------------------------- | -------------------------------------------- | ------ | ------ |
| CT-T01  | Session expiree                 | Tenter action (postuler/modifier/deposer) | Redirection login ou message session expiree |        |        |
| CT-T02  | Fichier volumineux/non autorise | Upload document invalide                  | Rejet controle + message clair               |        |        |
| CT-T03  | Coupure reseau simulee          | Soumettre candidature/dossier             | Gestion d'erreur propre, aucune corruption   |        |        |

---

## Journal des Anomalies

| ID anomalie | ID test | Description | Severite (Bloquant/Majeur/Mineur) | Statut correction |
| ----------- | ------- | ----------- | --------------------------------- | ----------------- |
|             |         |             |                                   |                   |
|             |         |             |                                   |                   |
|             |         |             |                                   |                   |

---

## Validation Finale Sprint 2

- [ ] Toutes les US nominales en PASS
- [ ] Tous les cas limites critiques valides
- [ ] Aucune anomalie bloquante ouverte
- [ ] Aucune anomalie majeure ouverte
- [ ] GO Sprint 2

Decision finale: GO / NO-GO
Valide par: ********\_\_\_\_********
Date: \_**\_ / \_\_** / **\_\_**
