# Web Temps Réel

## Architecture

The application is a modular NestJS monolith backed by PostgreSQL and Prisma,
with an Angular frontend served by Nginx. HTTP commands use versioned REST under
`/api/v1`, order
updates use SSE, and chat uses Socket.IO.

## Local development

Build the shared contracts before starting either application:

```bash
cd shared && npm ci && npm run build
cd ../backend && npm ci && npm run start:dev
cd ../front && npm ci && npm start
```

Set `DATABASE_URL` and a `JWT_SECRET` of at least 32 characters in the
environment. Apply migrations with `npm run db:migrate`; seed the demo
restaurant explicitly with `npm run db:seed`.

## Docker deployment

The Docker frontend is available at `http://localhost`. HTTPS is not required
for the local Docker environment.

`docker compose up --build` runs PostgreSQL, Redis, a one-shot migration
container, an explicit seed container, the backend, and Nginx. Database
migrations and seeding are deliberately separate from the application process.
The `migrate` and `seed` services must complete successfully before the backend
starts. Cookies use `COOKIE_SECURE=false` for the local HTTP Docker setup. For the
separate HTTP development servers, use `FRONTEND_URL=http://localhost:4200`
and `COOKIE_SECURE=false`.

Redis provides distributed authentication/chat rate limits and publishes the
transactional order outbox. Without `REDIS_URL`, the backend falls back to
in-memory limits and a process-local outbox publisher, preserving single
instance development.

The existing `/api` endpoints are intentionally not prefixed with a version:
the Angular client consumes them directly, so adding `/api/v1` would be a
breaking change. Introduce a versioned route set alongside the current routes
when the next frontend contract is planned.

Meal prices are stored as PostgreSQL `DECIMAL(10,2)` values and validated as
positive values at the shared API boundary. The API continues to expose
numbers for compatibility with the Angular client.

SSE clients reconnect with exponential backoff and send `lastEventId` on the
next connection. The backend replays persisted outbox events after that ID.
