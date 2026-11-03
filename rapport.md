# Rapport de présentation de l'application

## 1. Pourquoi cette application ?

Cette application est une solution de gestion des commandes d'un restaurant
en temps réel. Elle permet aux différents membres de l'équipe de suivre une
commande tout au long de son cycle de vie :

1. le serveur crée la commande et la transmet en cuisine ;
2. le responsable valide la commande ;
3. le cuisinier la prend en charge et la marque comme prête ;
4. le serveur la sert au client.

L'objectif est de centraliser les informations et d'éviter les échanges
informels ou les erreurs de transmission entre la salle, la gestion et la
cuisine. Chaque utilisateur accède aux actions correspondant à son rôle et à
son restaurant.

L'application intègre également un chat interne afin de faciliter la
communication entre les membres d'une même équipe.

## 2. Comment l'application est-elle construite ?

Le projet repose sur un monolithe modulaire composé de trois parties
principales :

- **NestJS** pour le backend et l'API ;
- **Angular** pour l'interface utilisateur ;
- **PostgreSQL**, utilisé avec Prisma, pour la persistance des données.

Redis est utilisé pour les fonctionnalités distribuées, notamment la
limitation du nombre de requêtes et la diffusion des événements lorsque
l'application fonctionne avec plusieurs instances.

Les contrats et schémas de validation communs sont regroupés dans le dossier
`shared/`. Cette organisation permet de partager les mêmes types entre le
frontend et le backend et de limiter les incohérences entre les deux parties
de l'application.

L'application expose une API REST versionnée sous `/api/v1`. Les mises à jour
des commandes sont transmises avec des **Server-Sent Events (SSE)** et le chat
utilise **WebSocket** avec Socket.IO.

### 2.1. Organisation en couches

Le backend suit une organisation en couches adaptée à un monolithe modulaire :

- **la couche présentation**, composée des contrôleurs REST et du gateway
  Socket.IO ;
- **la couche métier**, composée des services qui portent les règles de
  gestion des commandes, des utilisateurs et du chat ;
- **la couche d'accès aux données**, centralisée dans Prisma et PostgreSQL ;
- **la couche infrastructure**, qui regroupe Redis, l'outbox, les métriques,
  les middlewares et les mécanismes de santé de l'application.

Les contrôleurs reçoivent les requêtes et délèguent le traitement aux services.
Les services ne dépendent pas directement des composants Angular et peuvent
donc être testés indépendamment de l'interface.

### 2.2. Modules fonctionnels

Le backend est découpé en modules correspondant aux fonctionnalités
principales :

- **AuthModule** : inscription, connexion, déconnexion, JWT et stratégie
  d'authentification ;
- **OrderModule** : création des commandes, transitions d'état, annulation,
  SSE et publication des événements ;
- **ChatModule** : historique des messages et communication WebSocket ;
- **RedisModule** : service partagé pour le rate limiting et les échanges
  distribués ;
- **PrismaModule** : accès global à la base de données.

Ce découpage conserve un déploiement simple sous la forme d'un seul backend,
tout en isolant les responsabilités. Il est donc possible de faire évoluer
les modules sans introduire la complexité opérationnelle de plusieurs
microservices.

### 2.3. Flux d'une commande

Lorsqu'un serveur crée une commande, le flux est le suivant :

1. Angular envoie la commande à l'API REST avec le cookie d'authentification ;
2. NestJS valide le contenu avec les schémas partagés ;
3. les guards vérifient l'identité et le rôle de l'utilisateur ;
4. `OrderService` crée la commande et ses repas dans PostgreSQL ;
5. un événement est ajouté à la table d'outbox dans la même transaction ;
6. le worker outbox publie l'événement sur Redis ;
7. les clients SSE concernés reçoivent la mise à jour ;
8. l'interface Angular met à jour son tableau sans rechargement de page.

L'utilisation d'une outbox transactionnelle évite de modifier la commande sans
publier la notification correspondante. La commande et l'événement sont
persistés ensemble, ce qui permet de rejouer les événements après une
reconnexion.

### 2.4. Authentification et autorisation

L'authentification repose sur un JWT placé dans un cookie `HttpOnly`. Le
frontend ne manipule donc pas directement le token dans le stockage local du
navigateur.

À chaque requête protégée :

1. la stratégie JWT extrait le token depuis le cookie ;
2. l'utilisateur est recherché en base ;
3. son restaurant et son rôle sont ajoutés au contexte de la requête ;
4. les guards vérifient que le rôle peut exécuter l'action demandée.

Les requêtes métier utilisent également le code du restaurant dans leurs
filtres. Un utilisateur ne doit donc pas pouvoir consulter les commandes ou
les messages d'un autre restaurant uniquement en modifiant un identifiant.

Les requêtes qui modifient des données sont contrôlées par un middleware
d'origine afin de limiter les requêtes inter-sites utilisant les cookies
d'authentification. Helmet est également activé pour ajouter des protections
HTTP courantes.

### 2.5. Modèle de données

Les principales entités persistées sont :

```text
Restaurant
  ├── User
  ├── Order
  └── Message

Order
  ├── Meal
  └── OutboxEvent
```

Un restaurant possède plusieurs utilisateurs, commandes et messages. Une
commande appartient à un serveur et contient plusieurs repas. Chaque repas
possède son propre état, ce qui permet de représenter les commandes composées
de plusieurs éléments.

Les migrations Prisma versionnent l'évolution du schéma. Des index sont
également définis pour les recherches fréquentes par restaurant, commande et
état du repas.

### 2.6. Communication entre les composants

Nginx sert les fichiers Angular et joue le rôle de reverse proxy :

```text
Client web
   │
   ▼
Nginx
   ├── /api/v1/*       ──> API NestJS
   ├── /api/v1/events  ──> flux SSE NestJS
   └── /socket.io      ──> gateway Socket.IO NestJS
                                │
                                ├── PostgreSQL
                                └── Redis
```

En développement, le proxy Angular fournit le même chemin `/api` et redirige
les requêtes vers le backend local. Cette configuration évite de coder des
URLs différentes entre le développement et l'exécution derrière Nginx.

### 2.7. Déploiement

Docker Compose orchestre les composants nécessaires :

- PostgreSQL pour les données ;
- Redis pour les fonctionnalités distribuées ;
- un conteneur ponctuel pour appliquer les migrations ;
- un conteneur ponctuel pour charger les données de démonstration ;
- le backend NestJS ;
- le frontend Angular servi par Nginx.

Les migrations et le seeding sont séparés du processus principal du backend.
Le backend ne démarre qu'après la réussite des étapes nécessaires et la
disponibilité de Redis. Des endpoints de liveness et de readiness permettent
de vérifier l'état du service.

## 3. Pourquoi ces technologies ?

### 3.1 NestJS

NestJS a été choisi pour structurer le backend autour de modules, de services,
de contrôleurs et de guards. Cette organisation facilite la séparation des
responsabilités entre l'authentification, les commandes, le chat et les
fonctionnalités techniques comme Redis.

Le framework apporte également des mécanismes adaptés au projet :

- injection de dépendances ;
- guards pour l'authentification et les rôles ;
- contrôleurs REST ;
- prise en charge des WebSockets ;
- intégration avec les tests et les outils TypeScript.

Cette structure rend le code plus facile à maintenir et prépare le projet à
une évolution progressive sans devoir passer prématurément à une architecture
en microservices.

### 3.2 Angular

Angular a été utilisé pour construire une interface organisée par
fonctionnalités : authentification, commandes et chat. Le framework fournit
une structure claire pour les composants, les services, le routage et la
gestion réactive de l'état.

Le typage TypeScript permet de limiter les erreurs lors des échanges avec
l'API, notamment grâce aux contrats partagés avec le backend.

### 3.3 AG Grid

AG Grid a été choisi pour afficher le tableau des commandes. Plutôt que de
développer manuellement toutes les fonctionnalités d'un tableau, la
bibliothèque fournit déjà des fonctions utiles dans ce contexte :

- tri des colonnes ;
- filtres ;
- affichage structuré de données métier ;
- gestion des cellules personnalisées ;
- possibilité de faire évoluer le tableau avec davantage de lignes et de
  colonnes ;
- intégration avec Angular.

Ce choix permet de consacrer davantage de temps à la logique métier et aux
fonctionnalités temps réel, tout en conservant une interface efficace pour les
utilisateurs. Il s'agit également d'une technologie couramment utilisée dans
les applications professionnelles. L'utiliser dans ce projet m'a permis de la
découvrir avant de pouvoir éventuellement la retrouver dans un contexte
d'entreprise.

### 3.4 PostgreSQL et Prisma

PostgreSQL convient aux données structurées du projet : utilisateurs,
restaurants, commandes, repas et messages. Les relations et les contraintes
d'intégrité sont gérées au niveau de la base de données.

Prisma fournit une couche d'accès aux données typée et permet de versionner
les évolutions du schéma avec des migrations. Les opérations importantes,
comme la création d'une commande et de son événement associé, sont exécutées
dans une transaction.

## 4. Pourquoi utiliser des technologies temps réel ?

Le temps réel est important dans un restaurant, car plusieurs personnes
doivent voir rapidement les changements d'état d'une même commande. Sans mise
à jour en temps réel, chaque utilisateur devrait actualiser régulièrement la
page, ce qui ralentirait le traitement et pourrait provoquer des erreurs.

Les technologies temps réel permettent donc :

- de réduire les délais de transmission ;
- d'éviter les actualisations manuelles ;
- de donner à chaque rôle une vision actualisée des commandes ;
- de fluidifier le passage d'une étape à l'autre ;
- de limiter les risques de traiter une information obsolète.

## 5. Pourquoi utiliser WebSocket pour le chat ?

Le chat nécessite une communication bidirectionnelle et immédiate :

- le client envoie un message au serveur ;
- le serveur valide et enregistre le message ;
- le serveur diffuse ensuite le nouveau message aux autres utilisateurs
  connectés du même restaurant.

WebSocket est adapté à ce besoin, car la connexion reste ouverte et permet au
serveur d'envoyer directement les nouveaux messages aux clients sans que
ceux-ci aient besoin d'interroger régulièrement l'API.

Socket.IO ajoute des fonctionnalités pratiques autour de WebSocket, comme la
gestion des connexions, des événements et des reconnexions. Dans cette
application, les utilisateurs sont regroupés dans une salle correspondant à
leur restaurant afin qu'un message ne soit diffusé qu'aux membres de l'équipe
concernée.

## 6. Pourquoi utiliser les Server-Sent Events pour les commandes ?

Les mises à jour de commandes suivent principalement un flux allant du
serveur vers les utilisateurs. Lorsqu'une commande change d'état, le backend
doit notifier les rôles concernés :

- le serveur crée une commande et le responsable doit être informé ;
- le responsable valide la commande et la cuisine doit la voir ;
- le cuisinier termine la préparation et le serveur doit être prévenu ;
- le serveur sert la commande et son nouvel état doit être connu.

Les Server-Sent Events sont bien adaptés à ce scénario, car ils permettent au
serveur de pousser des événements vers le navigateur avec une technologie
simple basée sur HTTP. Contrairement au chat, le navigateur n'a pas besoin
d'envoyer continuellement des messages sur cette connexion : il écoute les
événements de commandes et réagit lorsqu'un changement est publié.

SSE présente plusieurs avantages pour ce flux :

- communication unidirectionnelle suffisante pour les notifications ;
- intégration simple avec le navigateur grâce à `EventSource` ;
- reconnexion automatique côté client ;
- possibilité d'utiliser un identifiant d'événement ;
- reprise des événements manqués grâce à l'outbox persistante.

Le choix de SSE pour les commandes et de WebSocket pour le chat permet donc
d'utiliser une technologie adaptée à chaque type de communication, au lieu
d'utiliser WebSocket pour tous les besoins.

## 7. Choix volontaire pour les tests

L'inscription publique permet actuellement au client de choisir le rôle du
nouvel utilisateur, y compris `MANAGER`.

Cette configuration est volontaire dans le cadre de ce projet afin de
faciliter les tests des différents parcours et des permissions associées à
chaque rôle. Dans une version destinée à la production, la création d'un
compte `MANAGER` devrait être protégée par une invitation, une configuration
initiale sécurisée ou une action réservée à un administrateur.
