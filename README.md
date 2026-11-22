# forma+ — suivi fitness

Application Angular de suivi sportif connectée à Supabase pour l’authentification et le stockage sécurisé des séances et objectifs. Aucun serveur Spring, MySQL ou Docker n’est nécessaire.

## Configuration Supabase

Le client utilise le projet Supabase configuré dans `src/environments/environment.ts`. La clé `sb_publishable_...` est une clé publique destinée au navigateur ; la sécurité des données repose sur les politiques Row Level Security du schéma.

Dans le tableau de bord du projet, ouvrez **SQL Editor**, puis exécutez le contenu de `supabase/schema.sql`. Ce script crée les tables `workouts` et `goals`, active RLS et autorise les comptes connectés à gérer uniquement leurs propres lignes.

Pour envoyer un code numérique, activez **Authentication → Providers → Email → Confirm email**, puis ouvrez **Authentication → Email Templates → Confirm signup** et utilisez `{{ .Token }}` dans le contenu du message (par exemple : `<p>Votre code forma+ : <strong>{{ .Token }}</strong></p>`). Supabase enverra alors le code lors de l’inscription ; l’application affiche le champ de vérification et permet de renvoyer le code. L’envoi dépend aussi de la configuration e-mail/SMTP de votre projet Supabase.

## Démarrer l’application

Prérequis : Node.js LTS et npm.

```powershell
npm.cmd ci
npm.cmd start
```

Ouvrir `http://localhost:4200`. Pour compiler l’application :

```powershell
npm.cmd run build
```

## Données et accès

- Supabase Auth gère l’inscription, la connexion, la session persistante et la déconnexion.
- Les séances et objectifs sont stockés dans les tables `public.workouts` et `public.goals`.
- Les politiques RLS utilisent `auth.uid()` pour isoler chaque compte ; ne désactivez pas RLS et ne mettez jamais une clé `service_role` dans le frontend.
- Les statistiques hebdomadaires sont calculées à partir des séances du compte connecté.
