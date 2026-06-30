# Qik Accounts Ledger Backend

NestJS backend setup for the Accounts & Ledger Service.

## Author

Alexander Batista

## Requirements

- Node.js 20
- Docker and Docker Compose

## Setup

```bash
cp .env.example .env
npm install
npm run start:dev
```

GraphQL runs at `http://localhost:3000/graphql`.
Swagger setup runs at `http://localhost:3000/docs`.

## Docker

```bash
docker compose up --build
```

The compose stack starts:

- API on port `3000`
- PostgreSQL on port `5432`
- Redis on port `6379`

## Database Migrations

Migrations use the TypeORM data source at
`src/infrastructure/database/typeorm.config.ts`.

Start PostgreSQL before running migrations:

```bash
docker compose up -d postgres
```

Run pending migrations:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

The migration commands read database settings from `.env`. For local Docker,
the defaults in `.env.example` point to `localhost:5432`.

Seed a local user and account:

```bash
npm run seed
```

The seed defaults can be overridden with the `SEED_*` variables in `.env`.

## Verification

```bash
npm run build
npm run lint
npm test
```

## Environment Variables

See `.env.example` for all required variables.
