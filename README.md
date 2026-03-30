# Artistryx E‑Commerce Platform

Artistryx is a comprehensive full-stack e-commerce marketplace specialized for early childhood learning products.  
Sellers can list educational materials (charts, coloring books, board games, flash cards, story books), while buyers can browse, filter, manage a cart, checkout, view their orders, and flag disputes if an item doesn't meet expectations.

This repository is a **full-stack monorepo** containing:

- `apps/api` – NestJS + Prisma 7 backend (compatible with MariaDB/MySQL)
- `apps/web` – Next.js App Router frontend (React 19)

The goal of this documentation is to give you everything you need to:

1. **Run the stack locally** (including the database and seeds)  
2. **Understand the architecture** (auth, roles, data flow, payouts)  
3. **Run tests and CI‑equivalent checks** confidently  

---

## 🚀 Key Features (Phase 3 Complete)

The platform supports a 3-tier user ecosystem:

1. **Customers:** Browse products, manage carts, place orders, view order histories, and initiate **order disputes**.
2. **Sellers:** Manage shop profiles, catalog products, track sales, and fulfill orders.
3. **Admins:** View platform statistics, oversee disputes, and manage **seller payload settlements/commissions**.

### Recent Additions (Phase 3)
- **Dispute Resolution:** Customers can dispute specific items after delivery. Admins review and resolve disputes (Refund vs. Release Funds).
- **Payout Management:** Automated or manual financial settlements between the platform and the sellers, tracked via reference numbers for auditability.
- **Robust Testing Setup:** Global and component-specific mock integrations (e.g., `useAuth`, `react-query` factories) allowing 100% test coverage on complex flows like checkout.

---

## 🛠️ Tech Stack

- **Frontend (`apps/web`)**
  - Next.js 15 App Router (RSC + client components)
  - React 19, TypeScript
  - Native CSS Modules + Design Tokens
  - TanStack Query v5, Axios
  - Jest & React Testing Library
- **Backend (`apps/api`)**
  - NestJS (Modular Architecture)
  - TypeScript
  - Prisma ORM **v7** (MySQL & MariaDB support)
  - `class-validator` DTOs, global validation pipe
- **Cross-cutting / Infrastructure**
  - **Auth:** JWT access tokens + HttpOnly refresh cookies; CSRF token security
  - **Database:** MariaDB/MySQL (via Docker or Aiven Cloud)
  - **Tooling:** pnpm workspaces, ESLint, Prettier

---

## 📁 Project Structure

The repository is organized into a monorepo containing the core application source code. 

```text
artistryx/
├── apps/
│   ├── api/                  # Backend API (NestJS)
│   └── web/                  # Frontend (Next.js)
├── docker-compose.yml        # MariaDB service for local dev/tests
├── package.json              # Root build & test scripts
└── pnpm-workspace.yaml       # Workspace configuration
```

> [!NOTE]
> Additional documentation (`docs/`) and build scripts (`scripts/`) are maintained separately and ignored in the public branch to maintain source-code cleanliness.

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js** 20+
- **pnpm** installed globally (`npm install -g pnpm`)
- **Docker** (if running the database locally)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup the Database
You can use the provided Docker Compose to launch a local MariaDB 11 instance:
```bash
docker compose up -d
```
*(This starts the DB on `localhost:3307` to avoid colliding with other local SQL servers).*

### 4. Configure Environment Variables
Copy the `.env.example` templates in each application folder to `.env` or `.env.local` and configure them.

**Backend (`apps/api/.env`)**:
```env
PORT=3001
DATABASE_URL="mysql://root:change-this-strong-password@127.0.0.1:3307/artistryx"
# Make sure to update your Secrets for production!
JWT_SECRET="super-secret-jwt-key"
REFRESH_TOKEN_SECRET="super-secret-refresh-key"
CSRF_SECRET="super-secret-csrf-key"
FRONTEND_URL="http://localhost:3000"
```

**Frontend (`apps/web/.env.local`)**:
```env
PORT=3000
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_IMAGE_HOSTNAMES="localhost,localhost:3001"
```

### 5. Apply Schema & Seed
Sync the database with Prisma and populate it with test data (Users, Products, Categories, complete Orders):
```bash
cd apps/api
npx prisma db push --accept-data-loss
pnpm db:seed
```

### 6. Run the Application
In development, use `pnpm dev` from the root, or run the apps individually:
```bash
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev
```
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/v1
- **Prisma Studio (DB Admin):** `cd apps/api && npx prisma studio`

---

## 🧪 Testing

The repository maintains an extremely strict test suite. Code is required to pass unit tests and component rendering tests.

### Frontend Tests
Validates DOM node rendering, interaction mocking, React-Query cache factories, and context injection.
```bash
cd apps/web
pnpm test
```

### Backend Tests
Validates isolated services, schema controllers, transactions (`$transaction` atomic data consistency), and route guards.
```bash
cd apps/api
pnpm test
pnpm test:e2e
```

---

## 📄 License and Contributing
This repository is marked as an internal platform template and is currently not accepting external pull-requests globally without prior approval of a designated architecture workflow branch. 