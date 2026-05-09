# Résumé des tests — Sprint 1

| Service             | Tests exécutés | Réussis | Échoués | Tests échoués (liste)                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | -------------: | ------: | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| candidature_service |             37 |      24 |      13 | test_publier_liste_calls_mass_notifications; test_01_types_documents_requis; test_02_upload_document_simple; test_03_upload_multiple_documents; test_04_consulter_dossier; test_05_soumission_dossier_incomplet; test_06_soumission_dossier_complet; test_07_suppression_document; test_09_validation_format_fichier; test_10_limite_taille_fichier; test_11_depassement_delai_depot; test_12_liste_mes_dossiers; test_str_document |

auth-service | 0 | 0 | 0 | (aucun test)

user-service | 0 | 0 | 0 | (aucun test)

---

Fichiers de sortie:

- Journal complet des tests candidature_service: tests_results/candidature_service_test_log.txt

Observations rapides:

- Plusieurs échecs d'intégration liés aux endpoints de dépôt de dossier (retour 404) — probablement routes/API manquantes ou mauvaises URL dans les tests.
- Un échec de permission pour `publier_liste` (retour 403) — vérifier les rôles/autorisations dans la fixture utilisateur du test.

Proposition de prochaine étape:

- Je peux commencer à corriger les échecs dans l'ordre: 1) endpoints 404 (vérifier `urls.py` et vues de dépôt de dossier), 2) permission 403 (vérifier rôle `responsable` vs `directeur`), puis relancer les tests et produire un tableau final mis à jour.

Voulez-vous que je commence les corrections maintenant ?
