# Artistryx API (NestJS)

NestJS backend for Artistryx e-commerce. Prisma + MySQL. Phase 0: root controller only; auth and domain modules to be added.

## Prerequisites

- Node.js LTS (20.x)
- MySQL 8.0 (e.g. via root `docker compose` on port 3307)

## Setup

```bash
npm install
```

Create `api/.env` (see root `.env.example` if needed):

```
DATABASE_URL="mysql://app:app@localhost:3307/artistryx"
PORT=3001
```

Apply migrations and seed:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## Run

```bash
# development (watch)
npm run start:dev

# production
npm run start:prod
```

API base: **http://localhost:3001**

## Project structure

```
src/
├── main.ts           Entry; listens on PORT from env
├── app.module.ts     Root module
├── app.controller.ts GET / (hello)
├── app.service.ts    Root service
test/                 E2E tests
prisma/
├── schema.prisma     Models: User, Role, Seller, Province, City, Barangay, Address, Product, Order, Cart, Payment, Review, Commission
├── seed.ts           ROLES, PROVINCE, CITY, AGE_RANGE, CATEGORIES, sample BARANGAYs
└── migrations/       SQL migrations
```

## Prisma

- **Prisma 6** (no `prisma.config.ts`; `DATABASE_URL` in `schema.prisma`).
- Commands: `npx prisma migrate dev`, `npx prisma migrate deploy`, `npx prisma db seed`, `npx prisma studio`.

## Tests

```bash
# unit
npm run test

# e2e
npm run test:e2e

# coverage
npm run test:cov
```

## Deployment

See [NestJS deployment](https://docs.nestjs.com/deployment). Ensure `DATABASE_URL` and `PORT` are set in the target environment and run `prisma migrate deploy` before starting the app.
