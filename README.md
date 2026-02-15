# Artistryx E-Commerce Platform

Early childhood learning products e-commerce. Phase 0 setup complete; web mockup and route shells in place.

## Setup

**Prerequisites:** Docker, Node.js LTS (20.x), npm.

### 1. Start MySQL

```bash
docker compose up -d
```

Wait until MySQL is healthy: `docker compose ps`

### 2. Configure API

In `api/.env` (copy from root `.env.example` if needed):

```
DATABASE_URL="mysql://app:app@localhost:3307/artistryx"
PORT=3001
```

### 3. Run migrations and seed

```bash
cd api
npx prisma migrate deploy
npx prisma db seed
```

### 4. Run the apps

**API (NestJS):**
```bash
cd api
npm run start:dev
```

**Web (Next.js):**
```bash
cd web
npm run dev
```

- API: http://localhost:3001  
- Web: http://localhost:3000

## Project structure

```
artistryx mockup/
├── api/                    NestJS backend (Prisma, MySQL)
├── web/                    Next.js frontend (vanilla CSS, Figma mockup)
│   └── src/
│       ├── app/            Routes and layout
│       │   ├── layout.tsx  Root layout (header + main + footer)
│       │   ├── page.tsx    Home
│       │   ├── cart/       Cart placeholder
│       │   ├── profile/    Profile placeholder
│       │   ├── sign-in/    Sign-in placeholder
│       │   ├── sign-up/    Sign-up placeholder
│       │   ├── shop/       Shop listing placeholder
│       │   ├── product/[id]/  Product detail placeholder
│       │   ├── address/    My addresses placeholder
│       │   └── seller/start-selling/  Seller onboarding placeholder
│       ├── components/     SiteHeader, SiteFooter, icons
│       ├── lib/            home-data (constants)
│       └── styles/         variables, reset, globals
├── docker-compose.yml
└── project details.md
```

## Web routes

| Route | Purpose |
|-------|---------|
| `/` | Home (hero, shop by category/age, top picks, what's new, shop by store, nurture CTA) |
| `/cart` | Shopping cart (placeholder) |
| `/profile` | Account profile (placeholder) |
| `/sign-in` | Sign in (placeholder) |
| `/sign-up` | Sign up / register (placeholder) |
| `/shop` | Product listing – supports `?category=`, `?age=`, `?store=` (placeholder) |
| `/product/[id]` | Product detail (placeholder) |
| `/address` | My addresses (placeholder) |
| `/seller/start-selling` | Seller onboarding (placeholder) |

Header links: Logo → `/`, START SELLING → `/seller/start-selling`, Cart → `/cart`, Account → `/profile`.

## File overview

### Web (Next.js)

| File | Purpose |
|------|---------|
| `web/src/app/layout.tsx` | Root layout: fonts, SiteHeader, main, SiteFooter. |
| `web/src/app/layout.module.css` | App wrapper and main flex layout. |
| `web/src/app/page.tsx` | Home page sections; uses `lib/home-data`, `components/icons`. |
| `web/src/app/page.module.css` | Home-only styles (hero, sections, product grid, nurture). |
| `web/src/app/globals.css` | Imports `../styles/globals.css`. |
| `web/src/components/site-header.tsx` | Logo, nav (Start Selling, search, cart, profile). |
| `web/src/components/site-footer.tsx` | Copyright. |
| `web/src/components/icons.tsx` | SearchIcon, CartIcon, UserIcon, ArrowRightIcon. |
| `web/src/lib/home-data.ts` | CATEGORIES, AGE_CARDS, STORES, PLACEHOLDER_PRODUCTS. |
| `web/src/styles/variables.css` | Design tokens. |
| `web/src/styles/globals.css` | Body, container, scrollbar, overflow. |
| `web/src/styles/reset.css` | Minimal reset. |

### API (NestJS)

| File | Purpose |
|------|---------|
| `api/src/main.ts` | App entry, listens on 3001. |
| `api/src/app.module.ts` | Root module. |
| `api/src/app.controller.ts` | Root controller. |
| `api/src/app.service.ts` | Root service. |
| `api/prisma/schema.prisma` | Database schema. |
| `api/prisma/seed.ts` | Seed data. |
| `api/.env` | DATABASE_URL, PORT. |

### Root

| File | Purpose |
|------|---------|
| `docker-compose.yml` | MySQL 8.0, host port 3307. |

## Important information

**Ports:** MySQL 3307, API 3001, Web 3000.

**Env (api/.env):** `DATABASE_URL="mysql://app:app@localhost:3307/artistryx"`, `PORT=3001`

**Web styling:** Vanilla CSS, tokens in `variables.css`, CSS Modules. No Tailwind. See `web/src/styles/README.md`.

**Logic (pre–frontend):** AgeRange seed idempotent; Commission `UNIQUE(OrderItemID)`.

**ReviewRating:** Prisma enum `one`–`five`; map to 1–5 in UI.

## Next steps

Implement real content and API wiring for cart, profile, sign-in, sign-up, shop, product, address, and seller flows per the development plan.
