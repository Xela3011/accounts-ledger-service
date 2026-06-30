# Qik Accounts Ledger Backend

NestJS backend setup for the Accounts & Ledger Service.

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

## Verification

```bash
npm run build
npm run lint
npm test
```

## Environment Variables

See `.env.example` for all required variables.
