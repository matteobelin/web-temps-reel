# Web Temps Réel

Application de gestion des commandes d’un restaurant en temps réel. Les
serveurs, cuisiniers et responsables suivent l’état des commandes et
échangent via un chat partagé par restaurant.

## Architecture

L’application est un monolithe modulaire composé de :

- un frontend Angular servi par Nginx ;
- une API NestJS ;
- une base PostgreSQL gérée avec Prisma ;
- Redis pour le rate limiting distribué, Socket.IO et la diffusion des
  événements ;
- des contrats et schémas de validation partagés dans `shared/`.

Les commandes HTTP utilisent l’API REST versionnée `/api/v1`. Les mises à jour
de commandes sont diffusées par SSE et le chat utilise Socket.IO.

```text
Navigateur
  ├── REST /api/v1       ──> Nginx ──> NestJS
  ├── SSE /api/v1/events  ──> Nginx ──> NestJS
  └── Socket.IO /chat     ──> Nginx ──> NestJS

NestJS ──> PostgreSQL
NestJS ──> Redis
```

## Prérequis

- Node.js 24 ou version compatible ;
- npm 11 ;
- PostgreSQL 17 ;
- Redis 7 ;
- Docker et Docker Compose pour l’exécution conteneurisée.

## Développement local

Les contrats partagés doivent être compilés avant de démarrer le backend ou le
frontend :

```bash
cd shared
npm ci
npm run build

cd ../backend
npm ci
npm run db:migrate
npm run start:dev

cd ../front
npm ci
npm start
```

Le frontend est accessible sur `http://localhost:4200`. Le proxy Angular
redirige `/api` et `/socket.io` vers le backend local sur le port `3000`.

### Variables d’environnement

Le seul fichier d’environnement local doit se trouver à la racine du dépôt.
Copiez `.env.example` vers `.env` à cet emplacement, puis renseignez au
minimum :

```env
DATABASE_URL=postgresql://postgres:change-this-password@localhost:5432/app_db
JWT_SECRET=une-cle-secrete-d-au-moins-32-caracteres
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:4200
COOKIE_SECURE=false
```

Le secret JWT doit comporter au moins 32 caractères. Les migrations peuvent
être appliquées avec `npm run db:migrate` depuis `backend/`. Le jeu de données
de démonstration est chargé explicitement avec :

Les scripts backend chargent automatiquement `../.env` lorsqu’ils sont lancés
depuis `backend/`. Aucun fichier `backend/.env` n’est nécessaire.

```bash
cd backend
npm run db:seed
```

## Exécution avec Docker Compose

Pour démarrer l’ensemble de la plateforme :

```bash
docker compose up --build
```

L’application est alors disponible sur `http://localhost`.

Compose démarre PostgreSQL, Redis, les conteneurs ponctuels de migration et de
seeding, le backend, puis Nginx. Le backend et le frontend attendent que les
services nécessaires soient prêts.

Pour un environnement HTTP local, utilisez :

```env
POSTGRES_PASSWORD=change-this-password
JWT_SECRET=une-cle-secrete-d-au-moins-32-caracteres
COOKIE_SECURE=false
```

En production, utilisez HTTPS et activez `COOKIE_SECURE=true`. Ne commitez
jamais les fichiers `.env` ni les secrets.

## Fonctionnement temps réel

Les événements de commande sont enregistrés dans une outbox transactionnelle
avec la modification métier. Le worker publie ensuite ces événements via Redis
et les transmet aux clients SSE.

Les clients SSE se reconnectent avec un délai progressif et transmettent
`lastEventId`. Le backend peut alors rejouer les événements persistés depuis le
dernier identifiant reçu.

Sans `REDIS_URL`, le backend utilise un rate limiting local et une diffusion
d’événements limitée au processus courant. Ce mode est réservé au
développement sur une seule instance.

## Scripts principaux

### Backend

```bash
npm run build       # Compile l’application
npm run start:dev   # Démarre le serveur en mode développement
npm run lint        # Vérifie le code
npm test            # Lance les tests unitaires
npm run test:e2e    # Lance les tests end-to-end
```

### Frontend

```bash
npm start           # Démarre Angular en développement
npm run build       # Compile l’application
npm test            # Lance les tests
```

### Contrats partagés

```bash
npm run build       # Compile les types et schémas partagés
```
