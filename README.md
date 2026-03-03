# Artistryx E‑Commerce Platform

Artistryx is a web-based marketplace for early childhood learning products.  
Sellers list educational materials (charts, coloring books, board games, flash cards, story books), and buyers browse, filter, manage a cart, and place orders.

This repository is a monorepo containing:

- `apps/api` – NestJS + Prisma backend (MySQL)
- `apps/web` – Next.js App Router frontend (React)

---

## Tech Stack

- **Frontend**: Next.js App Router, React, TypeScript, CSS Modules, design tokens  
- **Backend**: NestJS, TypeScript, Prisma, MySQL  
- **Data**: Prisma migrations + seed scripts  
- **HTTP Client**: Axios + TanStack React Query  
- **Validation**: `class-validator` for API DTOs, Zod for client-side schemas  
- **Tooling**: pnpm workspaces, Jest, Playwright  

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
├── docker-compose.yml        # MySQL service
├── package.json              # Root scripts
└── pnpm-workspace.yaml       # Workspace configuration
```

---

## Prerequisites

- Node.js 20.x  
- pnpm (workspace-aware package manager)  
- Docker (for MySQL)  

---

## Getting Started

### 1. Install dependencies

From the repo root:

```bash
pnpm install
```

### 2. Start MySQL

```bash
docker compose up -d
```

MySQL is exposed on `localhost:3307` with a database named `artistryx`.

### 3. Configure API environment

In `apps/api/.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3307/artistryx"
JWT_SECRET="change-this-in-production"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 4. Configure Web environment

In `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 5. Apply schema and seed data

From `apps/api`:

```bash
cd apps/api

pnpm db:push    # apply Prisma schema
pnpm db:seed    # seed roles, categories, age ranges, locations, test users
```

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

- **Auth**: Short-lived access tokens; refresh tokens stored in HttpOnly cookies.  
- **Roles**: Customer, Seller, Admin; enforced by guards and role metadata.  
- **Persistence**: Prisma models for users, sellers, products, carts, orders, payments, commissions, reviews, and addresses.  
- **Validation**: DTOs with `class-validator`, global validation pipe with whitelisting.  
- **Security**: Helmet headers, rate limiting, CORS configured per frontend origin.  

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

---

## Testing

### Backend

From `apps/api`:

```bash
pnpm test       # unit tests
pnpm test:e2e   # e2e and contract tests
```

Coverage includes services (auth, cart, orders, products, sellers, admin) and high-level auth and contract flows.

### Frontend

From `apps/web`:

```bash
pnpm test       # Jest + React Testing Library
pnpm test:e2e   # Playwright end-to-end tests
```

Coverage includes navbar, add-to-cart interactions, cart behavior, and end-to-end customer journeys.

---

## Deployment Notes

- API and web are independent services and can be deployed separately.  
- Configuration is driven by environment variables for API base URLs, ports, and database connection.  
- The database schema is fully described by `apps/api/prisma/schema.prisma` and migrations under `apps/api/prisma/migrations`.  

