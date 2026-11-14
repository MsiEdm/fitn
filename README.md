# forma+ — suivi fitness

Application de suivi sportif avec frontend Angular, API REST en microservices Spring Boot, MySQL et authentification JWT. Le projet se lance directement sur Windows, Linux ou macOS, sans Docker.

## Prérequis

- JDK 17 et Maven 3.9+
- MySQL 8+
- Node.js LTS et npm
- Postman pour les tests API (facultatif)

## Préparer MySQL

Démarrer MySQL localement, puis créer un utilisateur dédié. Dans un terminal MySQL connecté comme administrateur :

```sql
CREATE USER 'fitness'@'localhost' IDENTIFIED BY 'remplacer-par-un-mot-de-passe-local';
```

Depuis la console MySQL ouverte à la racine du projet, charger `backend/mysql/init.sql` :

```sql
SOURCE backend/mysql/init.sql;
```

Le script crée les bases `fitness_auth` et `fitness_data` et accorde à `fitness` les droits nécessaires. Hibernate crée ou met à jour les tables au démarrage.

## Démarrer le backend

Depuis la racine du projet, ouvrir un terminal PowerShell par service. Chaque commande `spring-boot:run` reste active dans son terminal.

Terminal authentification :

```powershell
$env:MYSQL_USER = 'fitness'
$env:MYSQL_PASSWORD = 'le-mot-de-passe-choisi-dans-MySQL'
$env:JWT_SECRET = node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
mvn -f backend/pom.xml -pl auth-service spring-boot:run
```

Terminal fitness : définir les mêmes trois variables, puis lancer :

```powershell
mvn -f backend/pom.xml -pl fitness-service spring-boot:run
```

Terminal statistiques : définir `JWT_SECRET` avec la même valeur que dans les deux autres services, puis lancer :

```powershell
mvn -f backend/pom.xml -pl statistics-service spring-boot:run
```

Terminal passerelle API :

```powershell
mvn -f backend/pom.xml -pl api-gateway spring-boot:run
```

Les services écoutent sur `8081` (authentification), `8082` (fitness), `8083` (statistiques) et `8080` (passerelle). Démarrer MySQL avant les services.

## Démarrer Angular

```powershell
npm.cmd ci
npm.cmd start
```

Ouvrir `http://localhost:4200`. Le proxy Angular transmet `/api` à la passerelle `http://localhost:8080`. Vérifier la compilation avec `npm.cmd run build`.

## SSL/TLS local

Le profil TLS active HTTPS sur l’API Gateway en `8443`. Pour le développement, générer un certificat autosigné PKCS12 depuis la racine :

```powershell
$env:TLS_KEY_STORE_PASSWORD = 'mot-de-passe-local-a-remplacer'
keytool -genkeypair -alias forma-local -keyalg RSA -keysize 2048 -storetype PKCS12 -keystore backend/forma-local.p12 -validity 365 -dname 'CN=localhost' -ext 'SAN=dns:localhost,ip:127.0.0.1' -storepass $env:TLS_KEY_STORE_PASSWORD
```

Dans le terminal de la passerelle, activer le profil et fournir le mot de passe choisi :

```powershell
$env:SPRING_PROFILES_ACTIVE = 'tls'
$env:TLS_KEY_STORE_PASSWORD = 'mot-de-passe-local-a-remplacer'
mvn -f backend/pom.xml -pl api-gateway spring-boot:run
```

Pour faire passer Angular par cette passerelle HTTPS, utiliser `npm.cmd run start:tls`. Le proxy désactive la vérification du certificat autosigné uniquement en développement. Le navigateur peut afficher un avertissement pour Swagger (`https://localhost:8443/swagger-ui/index.html`). Ne pas réutiliser ce certificat ni ce réglage dans un déploiement public : utiliser un certificat émis par une autorité de confiance et terminer TLS sur un reverse proxy ou une passerelle configurée pour la production.

## API, tests et documentation

- Swagger UI : `http://localhost:8080/swagger-ui/index.html` (ou `https://localhost:8443/swagger-ui/index.html` avec le profil TLS).
- Collection Postman : `postman/forma-fitness.postman_collection.json`. Sa variable `baseUrl` vaut `http://localhost:8080`; la remplacer par `https://localhost:8443` pour tester TLS. Avec un certificat autosigné, désactiver la vérification SSL dans Postman uniquement pour cet environnement local.
- Les requêtes de la collection couvrent l’inscription, la connexion, les accès protégés et les opérations sur les séances et objectifs.

L’inscription et la connexion retournent un JWT Bearer. Les mots de passe sont hachés avec BCrypt et les séances/objectifs sont isolés par compte. Les services internes utilisent HTTP sur `localhost`; pour une mise en production, protéger aussi les communications inter-services, les secrets et la base de données.

## Tests et versionnement

Compiler le backend depuis la racine avec `mvn -f backend/pom.xml verify` et le frontend avec `npm.cmd run build`. Le dépôt contient un `.gitignore`; Jenkins reste une option de CI et n’est pas requis pour lancer le projet.
