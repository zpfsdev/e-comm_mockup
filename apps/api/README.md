## Artistryx API (`apps/api`)

Backend service for the Artistryx marketplace. Exposes REST endpoints for authentication, products, cart, orders, reviews, sellers, disputes, payouts, and admin features.  
Runs on port 3001 with all routes prefixed by `/api/v1`.

---

### Tech stack

- Language: TypeScript  
- Framework: NestJS (modular architecture)  
- ORM: Prisma **7** with `@prisma/adapter-mariadb` (MariaDB 11 / MySQL‑compatible)  
- Auth: JWT access tokens + HttpOnly refresh cookies  
- Validation: `class-validator` DTOs with a global validation pipe  
- Security: Helmet security headers, rate limiting, global guards, CORS

---

### Module overview

- `auth`: register, login, refresh, change password, revoke refresh tokens  
- `users`: profile read/update and admin-facing user dashboard data  
- `sellers`: seller registration, dashboard stats, sales reports  
- `products`: product search and detail, seller product management  
- `cart`: per-user cart, item add/update/remove/clear  
- `orders`: create orders from cart, list and view orders, seller-facing item status updates  
- `reviews`: one review per purchased order item  
- `disputes`: customer-initiated order item disputes
- `commissions`: admin-facing payout management for shop balances
- `admin`: platform statistics, user and shop status management  
- `core`: guards, interceptors, decorators, exception filters, throttling  

The Prisma schema and migrations live under `apps/api/prisma/` and define all entities used above.

---

### Running the API locally

From the repo root:

```bash
cd apps/api

# development (watch mode)
pnpm dev

# production build
pnpm build
node dist/main.js
```

The API listens on port 3001 and expects the global prefix `/api/v1`.

---

### Environment configuration

Configuration is read from `.env` in `apps/api`:

- `DATABASE_URL` – MySQL‑style connection string (used by Prisma 7 + MariaDB adapter), for example  
  - `mysql://root:password@localhost:3307/artistryx`  
- `JWT_SECRET` – secret for signing **access tokens**  
- `REFRESH_TOKEN_SECRET` – secret for signing **refresh tokens** (must differ from `JWT_SECRET`)  
- `PORT` – API port (default `3001`)  
- `FRONTEND_URL` – frontend origin used for CORS (e.g. `http://localhost:3000`)  
- `NODE_ENV` – environment name (`development`, `production`, etc.)  

Prisma configuration lives in:

- `prisma.config.ts` – datasource config (reads `DATABASE_URL`)  
- `prisma/schema.prisma` – full data model  
- `prisma/migrations/` – generated SQL migrations

---

### Auth and security model

**Authentication**

- Login and registration issue a short‑lived access token and a long‑lived refresh token.  
- Access tokens are returned in the JSON response and expected as `Authorization: Bearer <token>`.  
- Refresh tokens are written to an HttpOnly cookie and never returned in the body.  
- `POST /auth/refresh` issues a new access token if the refresh token is valid and not revoked.
- A per‑user `refreshTokenVersion` allows admin‑driven revocation on status changes (e.g. deactivate user).

**Authorization**

- Global JWT guard protects all routes except those explicitly marked as public.  
- Role-based guard enforces role metadata (Customer, Seller, Admin).  
- Ownership checks are enforced in services (for example, sellers can only mutate their own products and order items).
- Transactional integrity (`$transaction`) is enforced for complex operations like dispute resolution and payout processing.

**Security headers and rate limiting**

- Helmet is configured with common security headers including Content Security Policy.  
- Throttling is enabled globally, with stricter limits on auth endpoints.  
- CORS is restricted to the configured frontend origin with credentials enabled.

---

### Testing

From `apps/api`:

```bash
# unit tests (services, guards, filters, controllers)
pnpm test

# e2e + contract tests (full app + real DB)
pnpm test:e2e
```

Unit tests use Nest testing modules and Prisma mocks.  
E2E tests:

- Start a full Nest application backed by the **MariaDB** test database  
- Use **seeded test data** from `prisma/seed.ts`  
- Exercise:
  - Auth flow (register, login, `/auth/me`, refresh)
  - Admin stats + `/admin/users` listing and user status toggles
  - Public product contracts (`/products` shape, pagination)

---

### High-level API surface

All routes are under `/api/v1`:

- `POST /auth/register` – create customer account  
- `POST /auth/login` – login and receive access token plus refresh cookie  
- `POST /auth/refresh` – refresh access token using refresh cookie  
- `GET /auth/me` – current user info  
- `GET /products` – paginated list with search and filters  
- `GET /products/:id` – product details  
- `GET /cart` – current user cart  
- `POST /cart/items` – add item to cart  
- `PATCH /cart/items/:productId` – update cart quantity  
- `DELETE /cart/items/:productId` – remove item from cart  
- `DELETE /cart` – clear cart  
- `POST /orders` – place order from cart  
- `GET /orders` and `GET /orders/:id` – order history and detail  
- `POST /orders/:id/dispute` – dispute an order item  
- `POST /reviews/order-items/:orderItemId` – review purchased item  
- `GET /reviews/product/:productId` – list product reviews (public, paginated)  
- `GET /admin/stats` – platform statistics (admin only)  
- `GET /admin/users` – user list for admin dashboard  
- `PATCH /admin/users/:id/status` – activate / deactivate user (admin only)  
- `PATCH /admin/shops/:id/status` – update shop status (Active/Inactive/Banned)  
- `PATCH /admin/disputes/:id` – resolve an order item dispute (admin only)
- `POST /admin/payouts` – settle shop commissions (admin only)
- `GET /health` – unauthenticated health check used by CI and readiness probes  

For the full list of endpoints and DTOs, refer to the controllers and DTOs under `src/`.
