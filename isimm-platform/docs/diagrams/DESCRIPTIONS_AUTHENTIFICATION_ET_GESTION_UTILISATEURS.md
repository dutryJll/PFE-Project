# Description des diagrammes - Sprint 1

## 1) Authentification

**Titre**
Authentification

**Acteurs**

- Candidat
- Membre de commission
- Responsable de commission
- Administrateur

**Precondition**

- L'acteur est inscrit (compte existant et actif).
- L'acteur n'a pas de session active au moment de la connexion.

**Scenario nominal**

1. L'acteur accede au site.
2. Le systeme affiche la page d'authentification.
3. L'acteur saisit son email/username et son mot de passe.
4. Il clique sur le bouton connexion.
5. Le systeme verifie les donnees.
6. Le systeme genere les tokens (access + refresh).
7. Le systeme retourne les informations utilisateur + tokens.
8. Le frontend stocke la session et charge les actions autorisees.
9. Le systeme redirige l'acteur vers son tableau de bord.

**Scenario d'exception**
5.1. Si les donnees sont invalides, le systeme retourne une erreur (400/401) avec message.
5.2. Si le compte est desactive, le systeme retourne 403.

**Post condition**

- L'acteur est authentifie.
- Session ouverte avec token d'acces et token de rafraichissement.

---

## 2) Gestion des utilisateurs

**Titre**
Gestion des utilisateurs

**Acteurs**

- Administrateur

**Precondition**

- L'administrateur est authentifie.
- L'administrateur possede l'action "Gerer utilisateurs".

**Scenario nominal**

1. L'administrateur ouvre l'ecran de gestion des utilisateurs.
2. Le frontend appelle `GET /api/auth/users/`.
3. Le systeme retourne la liste des utilisateurs.
4. L'administrateur clique sur Ajouter.
5. Le frontend appelle `POST /api/auth/users/create/`.
6. Le systeme cree l'utilisateur (201 Created).
7. L'administrateur peut modifier un utilisateur via `PUT /api/auth/users/{id}/`.
8. L'administrateur peut supprimer un utilisateur via `DELETE /api/auth/users/{id}/delete/`.

**Scenario d'exception**
6.1. Si les donnees sont invalides ou dupliquees (email/username), le systeme retourne 400 Bad Request.
6.2. Si la requete n'est pas autorisee, le systeme retourne 401/403.

**Post condition**

- La liste des utilisateurs est mise a jour.
- Les operations de creation/modification/suppression sont persistees.
