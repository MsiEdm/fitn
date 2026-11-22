# Cahier des charges — forma+

**Projet :** application de suivi fitness  
**Version :** 1.0  
**Date :** 22 novembre 2026  
**Statut :** application web Angular connectée à Supabase

## 1. Présentation du projet

forma+ est une application web qui permet à une personne de suivre ses entraînements et ses objectifs personnels. Elle centralise les séances, calcule des indicateurs d’activité et présente la progression dans un tableau de bord.

L’application est destinée à un usage individuel. Chaque utilisateur dispose d’un compte et ne peut consulter ou modifier que ses propres données.

## 2. Objectifs

- Créer un compte et authentifier l’utilisateur par e-mail et mot de passe.
- Confirmer l’adresse e-mail avec un code à usage unique envoyé par Supabase Auth.
- Enregistrer, consulter, modifier et supprimer des séances sportives.
- Créer et suivre des objectifs personnels avec une valeur de départ, une valeur actuelle, une cible et une échéance.
- Afficher un tableau de bord et des statistiques calculées à partir des séances.
- Protéger les données par compte grâce aux politiques Row Level Security (RLS) de Supabase.

## 3. Périmètre

### Inclus

- Application web responsive en français.
- Inscription, connexion, confirmation d’adresse par code, renvoi du code et déconnexion.
- Tableau de bord, historique des séances, objectifs et statistiques.
- Persistance des données dans Supabase Database.
- Séparation stricte des données utilisateur par RLS.

### Hors périmètre de la version actuelle

- Comptes entraîneur, administrateur ou gestion multi-utilisateur.
- Programmes d’entraînement, nutrition, partage social ou messagerie.
- Synchronisation avec des montres et applications de santé.
- Notifications push, export PDF/CSV et mode hors ligne.
- Réinitialisation du mot de passe et suppression autonome du compte.

## 4. Utilisateurs et droits

| Profil | Droits |
| --- | --- |
| Visiteur | Créer un compte ou se connecter ; ne peut pas accéder aux données privées. |
| Utilisateur connecté | Gérer ses séances et objectifs, consulter ses statistiques et se déconnecter. |

Il n’existe pas de rôle administrateur dans l’interface. L’administration de Supabase relève du propriétaire du projet.

## 5. Exigences fonctionnelles

### EF-01 — Inscription

L’utilisateur fournit un nom d’utilisateur, une adresse e-mail et un mot de passe d’au moins 8 caractères. L’application demande à Supabase Auth de créer le compte. Lorsque la confirmation est activée, l’application indique que le code a été envoyé et affiche le formulaire de vérification.

### EF-02 — Confirmation par code

L’utilisateur saisit le code reçu à l’adresse indiquée. L’application vérifie le code avec Supabase Auth. En cas de réussite, la session est ouverte et les données personnelles sont chargées. En cas d’échec, un message permet de corriger le code ou d’en demander un nouveau.

L’envoi d’un code nécessite la confirmation e-mail activée et un modèle « Confirm signup » utilisant `{{ .Token }}`. Pour envoyer à des personnes qui ne font pas partie de l’équipe Supabase, le projet doit disposer d’un service SMTP configuré.

### EF-03 — Connexion et déconnexion

L’utilisateur se connecte avec son adresse e-mail et son mot de passe. La session est conservée par Supabase Auth afin de rester connectée après actualisation de la page. La déconnexion ferme la session et efface les données affichées à l’écran.

### EF-04 — Séances

L’utilisateur peut créer, consulter, modifier et supprimer une séance. Une séance contient :

- une activité : course, musculation, vélo, natation, yoga ou autre ;
- une durée en minutes, comprise entre 1 et 1 440 ;
- une dépense calorique comprise entre 0 et 10 000 kcal ;
- une date ;
- une note facultative de 280 caractères maximum.

L’historique est trié par date décroissante. Le tableau de bord présente les séances récentes.

### EF-05 — Objectifs

L’utilisateur peut créer, consulter, modifier et supprimer un objectif. Un objectif contient un titre, une valeur de départ, une valeur actuelle, une cible, une unité et une échéance. L’interface calcule un pourcentage de progression et affiche l’échéance.

### EF-06 — Tableau de bord et statistiques

Le tableau de bord présente les séances de la semaine, la durée et les calories de la semaine, les séances et calories du mois, les objectifs et les dernières séances. Une vue statistique présente les durées par jour de la semaine ainsi qu’un bilan mensuel.

Les statistiques sont calculées à partir des séances accessibles au compte connecté. La semaine commence le lundi.

### EF-07 — Gestion des erreurs

L’interface affiche un message compréhensible en cas d’identifiants invalides, de code expiré, de limite d’envoi atteinte, d’échec réseau ou d’erreur de stockage. Elle ne doit pas afficher de succès si la création du compte ou l’envoi du code a échoué.

## 6. Exigences de données et sécurité

- Les comptes sont gérés par Supabase Auth ; les mots de passe ne sont pas stockés dans les tables métier.
- Les tables `public.workouts` et `public.goals` associent chaque ligne à l’identifiant UUID de son propriétaire (`user_id`).
- RLS doit rester activé. Chaque lecture, insertion, modification et suppression est limitée à `auth.uid()`.
- La clé Supabase publishable peut être incluse dans le client web. Une clé `service_role` ne doit jamais être intégrée au frontend ni commitée dans le dépôt.
- Les entrées sont validées côté interface et par des contraintes SQL.
- Le transport vers Supabase utilise HTTPS.
- Les courriels de confirmation sont envoyés par le service Auth de Supabase ; les identifiants SMTP restent dans la configuration Supabase, jamais dans le code Angular.

## 7. Exigences non fonctionnelles

- **Compatibilité :** versions récentes de Chrome, Edge, Firefox et Safari.
- **Responsive :** utilisation sur ordinateur, tablette et téléphone.
- **Langue :** français pour les textes et formats de date.
- **Disponibilité des données :** les données sont persistées dans Supabase et rechargées après reconnexion.
- **Accessibilité :** formulaires libellés, erreurs visibles, commandes utilisables au clavier et contrastes lisibles.
- **Performance :** chargement des vues principales fluide pour un compte contenant quelques milliers de séances au maximum.
- **Maintenabilité :** interface Angular séparée du service Supabase et schéma SQL versionné dans le dépôt.

## 8. Architecture et technologies

- **Frontend :** Angular, TypeScript, HTML et CSS.
- **Authentification :** Supabase Auth.
- **Stockage :** Supabase PostgreSQL avec politiques RLS.
- **Accès aux données :** bibliothèque officielle `@supabase/supabase-js` dans le navigateur.
- **Schéma et politiques :** `supabase/schema.sql`.
- **Configuration locale du client :** `src/environments/environment.ts`.

Il n’y a pas de serveur Spring Boot ni de base MySQL requis pour exécuter la version actuelle de l’application.

## 9. Parcours utilisateur principal

1. Le visiteur ouvre l’application et choisit de créer un compte.
2. Il saisit ses informations ; Supabase Auth crée le compte et envoie le code de confirmation.
3. Il saisit le code dans l’application ; le compte est vérifié et la session est ouverte.
4. Il ajoute des séances et des objectifs ; les données sont enregistrées dans Supabase.
5. Il consulte le tableau de bord et ses statistiques personnelles.
6. Il se déconnecte ; les données privées disparaissent de l’écran.

## 10. Critères de recette

| ID | Résultat attendu |
| --- | --- |
| R-01 | Une inscription valide crée un compte et déclenche l’e-mail de confirmation lorsque cette option est activée. |
| R-02 | Un code valide confirme le compte et ouvre une session ; un code invalide affiche une erreur sans ouvrir la session. |
| R-03 | Le renvoi du code utilise Supabase Auth et affiche le résultat réel de la requête. |
| R-04 | Un utilisateur connecté peut créer, modifier et supprimer une séance ; les changements restent visibles après rechargement. |
| R-05 | Un utilisateur connecté peut créer, modifier et supprimer un objectif ; la progression affichée correspond aux valeurs saisies. |
| R-06 | Le tableau de bord et les statistiques correspondent aux séances du compte connecté et aux périodes affichées. |
| R-07 | Un compte ne peut ni lire ni modifier les séances ou objectifs appartenant à un autre compte, y compris en appelant directement Supabase. |
| R-08 | La déconnexion ferme l’accès aux vues privées et efface les données privées de l’état visible. |
| R-09 | L’application affiche une erreur explicite lorsque Supabase refuse l’envoi d’un e-mail ou que le service est indisponible. |
| R-10 | Les vues principales restent utilisables sur téléphone et ordinateur. |

## 11. Déploiement et prérequis d’exploitation

1. Créer/configurer le projet Supabase et exécuter `supabase/schema.sql` dans le SQL Editor.
2. Vérifier l’activation des inscriptions et de la confirmation des adresses e-mail.
3. Configurer le modèle de confirmation pour inclure `{{ .Token }}`.
4. Configurer SMTP personnalisé pour les envois hors équipe Supabase et pour un usage réel.
5. Renseigner l’URL du projet et la clé publishable dans l’environnement Angular.
6. Installer les dépendances avec `npm ci`, lancer en développement avec `npm start`, et compiler avec `npm run build`.

## 12. Évolutions possibles

- Réinitialisation du mot de passe par e-mail.
- Suppression du compte et export de ses données.
- Recherche, filtres et pagination dans l’historique.
- Graphiques multi-périodes et statistiques annuelles.
- Catégories d’objectifs et recommandations personnalisées.
- Tests automatisés des parcours Auth et des politiques RLS.
