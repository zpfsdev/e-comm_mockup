# Artistryx E‑Commerce Platform

Artistryx is a web-based marketplace for early childhood learning products.  
Sellers list educational materials (charts, coloring books, board games, flash cards, story books), and buyers browse, filter, manage a cart, and place orders.

This repository is a **full-stack monorepo** containing:

- `apps/api` – NestJS + Prisma 7 backend (MySQL‑compatible MariaDB via driver adapter)
- `apps/web` – Next.js App Router frontend (React 19)

The goal of this documentation is to give you everything you need to:

1. **Run the stack locally** (including the database and seeds)  
2. **Understand the architecture** (auth, roles, data flow)  
3. **Run tests and CI‑equivalent checks** confidently  

---

## Tech Stack

- **Frontend**
  - Next.js App Router (RSC + client components)
  - React 19, TypeScript
  - CSS Modules + design tokens
  - TanStack Query, Axios api-client wrapper
- **Backend**
  - NestJS (modular architecture)
  - TypeScript
  - Prisma ORM **v7** using `@prisma/adapter-mariadb`
  - **MariaDB 11** in Docker (MySQL‑compatible)
  - `class-validator` DTOs, global validation pipe
- **Cross-cutting**
  - Auth: JWT access tokens + HttpOnly refresh cookies; CSRF token for refresh
  - Roles: `Admin`, `Seller`, `Customer` via role guard
  - Testing: Jest (unit + e2e), Playwright (web e2e)
  - Tooling: pnpm workspaces, GitHub Actions CI, Lighthouse CI, CodeQL

---

## Project Structure

```text
artistryx/
├── apps/
│   ├── api/                  # Backend API (NestJS)
│   │   ├── src/
│   │   │   ├── auth/         # Auth, JWT, refresh tokens
│   │   │   ├── users/        # Profiles and admin user views
│   │   │   ├── sellers/      # Seller accounts and dashboards
│   │   │   ├── products/     # Products, filters, search
│   │   │   ├── cart/         # Cart and cart items
│   │   │   ├── orders/       # Orders and order items
│   │   │   ├── reviews/      # Product reviews
│   │   │   ├── admin/        # Admin statistics and status toggles
│   │   │   └── core/         # Guards, filters, decorators, throttling
│   │   └── prisma/           # schema.prisma and migrations
│   └── web/                  # Frontend (Next.js)
│       └── src/
│           ├── app/
│           │   ├── (main)/   # Main pages (home, products, cart, checkout, orders, profile, dashboards)
│           │   └── auth/     # Sign-in / sign-up
│           ├── components/   # Layout + UI components
│           ├── lib/          # api-client, constants, utils
│           └── providers/    # AuthProvider, QueryProvider
├── docker-compose.yml        # MariaDB service for local dev/tests
├── package.json              # Root scripts
└── pnpm-workspace.yaml       # Workspace configuration
```

---

## Prerequisites

- **Node.js** 20.x  
- **pnpm** (workspace-aware package manager)  
- **Docker** (for MariaDB 11)

Optional but recommended:

- A modern terminal (PowerShell or bash)
- VS Code / Cursor with TypeScript + ESLint integration

---

## Getting Started

### 1. Install dependencies (monorepo root)

From the repo root:

```bash
pnpm install
```

### 2. Start MySQL

```bash
docker compose up -d
```

This starts **MariaDB 11** with:

- Host: `localhost`
- Port: `3307` (mapped to container 3306)
- Database: `artistryx`
- Root password: taken from `.env` in the repo root:

```env
MYSQL_ROOT_PASSWORD=password
```

You can inspect the container with:

```bash
docker ps --filter "name=artistryx-mysql"
docker logs artistryx-mysql
```

### 3. Configure API environment

In `apps/api/.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3307/artistryx"
JWT_SECRET="change-this-in-production"
REFRESH_TOKEN_SECRET="change-this-too"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

Notes:

- `DATABASE_URL` uses a **MySQL‑style DSN**, but Prisma 7 talks to MariaDB via `@prisma/adapter-mariadb` under the hood.
- `REFRESH_TOKEN_SECRET` is separate from `JWT_SECRET` (refresh and access tokens do **not** share a secret).

### 4. Configure Web environment

In `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_IMAGE_HOSTNAMES=localhost:3000
```

### 5. Apply schema and seed data

From `apps/api` (database must be running):

```bash
cd apps/api

# Apply schema (Prisma 7 + prisma.config.ts)
pnpm db:push

# Seed roles, age ranges, categories, locations, users, products, one test order
pnpm db:seed
```

The seed script creates:

- Roles: `Admin`, `Customer`, `Seller`
- Test accounts:
  - `admin@artistryx.test` / `TestPass1!`
  - `testcustomer@artistryx.test` / `TestPass1!`
  - `testcustomer2@artistryx.test` / `TestPass1!`
  - `testseller@artistryx.test` / `TestPass1!`
  - `testseller2@artistryx.test` / `TestPass1!`
- Two shops with products and one completed order for `testcustomer@artistryx.test`

### 6. Run the apps

From the repo root:

```bash
pnpm dev
```

Or in separate terminals:

```bash
# API
cd apps/api
pnpm dev

# Web
cd apps/web
pnpm dev
```

Services:

- Frontend: http://localhost:3000  
- API: http://localhost:3001/api/v1  

---

## Backend Overview (`apps/api`)

### Responsibilities

- User registration, login, and profile management  
- JWT-based auth with HttpOnly refresh cookies  
- Product catalog with filtering and pagination  
- Cart operations per user  
- Order placement and order item status management  
- Seller onboarding, dashboards, and sales reports  
- Reviews constrained to purchased items  
- Admin operations for users, shops, and platform statistics  

### Key Concepts

- **Auth**
  - Short-lived access tokens (15m by default)
  - Refresh tokens stored in HttpOnly cookies with CSRF protection (`X-CSRF-Token`)
  - Admin‑driven revocation via `refreshTokenVersion` bump on user deactivation
- **Roles**
  - `Admin`, `Seller`, `Customer` via `RoleName` enum
  - Enforced by `JwtAuthGuard` + `Roles` decorator
- **Persistence**
  - Prisma v7 models for users, sellers, products, carts, orders, payments, commissions, reviews, and addresses
  - Backed by **MariaDB 11** via `@prisma/adapter-mariadb`
- **Validation**: DTOs with `class-validator`, global validation pipe with whitelisting.  
- **Security**: Helmet headers, rate limiting, CORS configured per frontend origin.  

For more detail see `apps/api/README.md`.

---

## Frontend Overview (`apps/web`)

### Responsibilities

- Public marketing home and product discovery  
- Product listing with filters (category, age, store) and search  
- Product detail pages with add-to-cart entry points  
- Cart UI with quantity adjustments and order total breakdown  
- Checkout flow using the cart and captured address details  
- Order list and order detail pages  
- Profile editing and role-specific dashboard views  

### Architecture

- **Routing**: Next.js App Router, route groups for main layout and auth.  
- **State**:  
  - `AuthProvider` manages authenticated user state and session.  
  - TanStack Query manages server state (products, cart, orders, profile).  
- **Styling**: CSS Modules powered by design tokens (`tokens.css`) for colors, typography, spacing, and radii.  
- **Images**: `next/image` used for hero images, products, and avatars.  

For more detail see `apps/web/README.md`.

---

## Testing

### Backend

From `apps/api`:

```bash
pnpm test       # unit tests
pnpm test:e2e   # e2e and contract tests
```

Coverage includes:

- Services: auth, cart, orders, products, sellers, reviews, admin
- Auth behaviors: refresh, password change, logout-all, inactivity
- Contract tests: `/products` shape, pagination
- E2E: auth flow, admin stats and user status toggles

### Frontend

From `apps/web`:

```bash
pnpm test       # Jest + React Testing Library
pnpm test:e2e   # Playwright end-to-end tests
```

Coverage includes:

- Navbar behavior, search, accessibility affordances
- Auth screens (sign-in / sign-up)
- Cart and checkout interactions
- Orders list / detail views
- Seller & admin dashboards (Playwright)

---

## Deployment Notes

- API and web are independent services and can be deployed separately (e.g. API on a Node host, web on Vercel)  
- Configuration is driven by environment variables for:
  - API base URLs (`NEXT_PUBLIC_API_URL`, `FRONTEND_URL`)
  - Ports (`PORT`, Next.js port)
  - Database connection (`DATABASE_URL`)
- Database:
  - Schema is fully described by `apps/api/prisma/schema.prisma`
  - Migrations live in `apps/api/prisma/migrations`
  - Prisma is configured via `apps/api/prisma.config.ts`

For CI and security details (Dependabot, CodeQL, Lighthouse, Playwright in CI), refer to `.github/workflows/` and comments inside `ci.yml` / `security.yml`. 