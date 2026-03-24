# Artistryx — Design Documentation

> **Last updated:** March 2026 · **Version:** 2.0

## 1. Overview

Artistryx is a premium e-commerce platform for early childhood learning products. It connects independent sellers with parents seeking high-quality educational toys, STEM kits, story books, and creative materials for children ages 0–6+.

**Key objectives:**
- Visually stunning, Figma-faithful UI that inspires creativity
- Robust multi-role system (Customer, Seller, Admin)
- Full shopping lifecycle: browse → cart → checkout → order tracking
- Seller storefront management and dashboard analytics

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) | Server Components + Client Components |
| **Backend** | NestJS 10 | REST API with JWT auth |
| **ORM** | Prisma 5 | Type-safe MySQL queries |
| **Database** | MySQL / MariaDB | Relational, InnoDB |
| **Monorepo** | pnpm workspaces | `apps/web`, `apps/api` |
| **Testing** | Playwright (E2E), Jest (unit) | Cross-browser E2E |
| **Styling** | Vanilla CSS + CSS Modules | Design tokens system |

---

## 3. Architecture

```mermaid
graph TB
  subgraph Client["Next.js 15 Frontend (apps/web)"]
    SC["Server Components"]
    CC["Client Components"]
    MW["Middleware (auth redirect)"]
  end

  subgraph API["NestJS Backend (apps/api)"]
    CTRL["Controllers"]
    SVC["Services"]
    GUARD["Auth Guards (JWT + CSRF)"]
  end

  subgraph DB["MySQL Database"]
    PRISMA["Prisma ORM"]
  end

  SC -->|fetch + revalidate| CTRL
  CC -->|apiClient (axios)| CTRL
  MW -->|redirect unauthenticated| SC
  CTRL --> GUARD
  GUARD --> SVC
  SVC --> PRISMA
  PRISMA --> DB
```

### Monorepo Structure
```
artistryx/
├── apps/
│   ├── api/              # NestJS REST API (port 3000)
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/
│   │       ├── catalog/  # Products, Categories, Reviews
│   │       ├── identity/ # Auth, Users, Admin, Addresses
│   │       ├── sales/    # Cart, Orders, Sellers
│   │       └── prisma/   # PrismaService provider
│   └── web/              # Next.js frontend (port 3010)
│       ├── e2e/          # Playwright E2E tests
│       ├── public/       # Static assets (images)
│       └── src/
│           ├── app/      # App Router pages
│           ├── components/
│           ├── lib/      # API client, constants
│           ├── providers/ # Auth, Query providers
│           ├── styles/   # Design tokens
│           └── types/    # TypeScript interfaces
├── output/               # Standalone build output
└── pnpm-workspace.yaml
```

---

## 4. Database Schema (ERD)

```mermaid
erDiagram
  User ||--o{ UserRole : has
  User ||--o| Cart : has
  User ||--o{ Order : places
  User ||--o| Seller : "can be"
  User ||--o{ UserAddress : has
  User ||--o{ Review : writes

  Role ||--o{ UserRole : assigned

  Province ||--o{ City : contains
  City ||--o{ Barangay : contains
  Barangay ||--o{ Address : contains
  Address ||--o{ UserAddress : used_in

  Seller ||--o{ Product : sells
  Seller ||--o{ Commission : earns

  Category ||--o{ Product : categorizes
  AgeRange ||--o{ Product : targets

  Product ||--o| ProductDetail : "has specs"
  Product ||--o{ CartItem : "in cart"
  Product ||--o{ OrderItem : ordered

  Cart ||--o{ CartItem : contains

  Order ||--o{ OrderItem : contains
  Order ||--o| Payment : "paid via"
  Order }o--o| UserAddress : "shipped to"

  OrderItem ||--o| Review : reviewed
  OrderItem ||--o| Commission : generates
```

### Model Summary

| Model | Purpose | Key Fields |
|---|---|---|
| `User` | Platform user account | firstName, lastName, email, password, status |
| `Role` | Role definition (Admin/Customer/Seller) | roleName |
| `UserRole` | User-role junction | userId, roleId |
| `Seller` | Seller storefront profile | shopName, shopDescription, shopLogoUrl |
| `Product` | Product listing | name, description, price, stockQuantity, status |
| `ProductDetail` | Physical specs | height, weight, width, length, material |
| `Category` | Product category | categoryName, description, imageUrl |
| `AgeRange` | Target age classification | minAge, maxAge, label |
| `Cart` | User's shopping cart | userId |
| `CartItem` | Cart item entry | cartId, productId, quantity |
| `Order` | Purchase order | userId, totalAmount, orderStatus, shippingFee |
| `OrderItem` | Individual order line | orderId, productId, quantity, price, orderItemStatus |
| `Payment` | Order payment record | orderId, paymentAmount, paymentStatus |
| `Review` | Product review (post-delivery) | userId, orderItemId, rating, comment |
| `Commission` | Seller commission from sale | sellerId, orderItemId, commissionAmount |
| `Province` | Philippine province | province |
| `City` | City within province | city, postalCode |
| `Barangay` | Barangay within city | barangay |
| `Address` | Street-level address | street, barangayId |
| `UserAddress` | User's saved addresses | userId, addressId, addressType, isDefault |

### Enums

| Enum | Values |
|---|---|
| `UserStatus` | Active, Inactive |
| `ShopStatus` | Active, Inactive, Banned |
| `ProductStatus` | Available, Unavailable |
| `OrderStatus` | Pending, InTransit, Completed, Cancelled |
| `OrderItemStatus` | Pending, InTransit, Completed, Cancelled |
| `PaymentStatus` | Paid, Unpaid |
| `CommissionStatus` | Paid, Unpaid |
| `AddressType` | Home, Work |
| `RoleName` | Admin, Customer, Seller |

---

## 5. API Endpoint Catalog

Base URL: `http://localhost:3000`

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | ❌ | Health check |

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns JWT |
| POST | `/auth/refresh` | 🔑 | Refresh access token |
| GET | `/auth/me` | 🔑 | Get current user |
| POST | `/auth/change-password` | 🔑 | Change password |
| POST | `/auth/logout` | 🔑 | Logout current session |
| POST | `/auth/logout-all` | 🔑 | Invalidate all sessions |

### Users (`/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/profile` | 🔑 | Get profile |
| PATCH | `/users/profile` | 🔑 | Update profile |

### Addresses (`/users/addresses`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/addresses` | 🔑 | List addresses |
| POST | `/users/addresses` | 🔑 | Create address |
| PATCH | `/users/addresses/:id` | 🔑 | Update address |
| DELETE | `/users/addresses/:id` | 🔑 | Delete address |
| PATCH | `/users/addresses/:id/default` | 🔑 | Set default |

### Products (`/products`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | ❌ | List products (paginated, filterable) |
| GET | `/products/:id` | ❌ | Get product detail |
| GET | `/products/mine` | 🔑🏪 | Seller's own products |
| POST | `/products` | 🔑🏪 | Create product |
| PATCH | `/products/:id` | 🔑🏪 | Update product |
| DELETE | `/products/:id` | 🔑🏪 | Soft-delete product |

**Query params for `GET /products`:** `search`, `categoryId`, `ageRangeId`, `sellerId`, `sort` (popular|newest), `page`, `limit`

### Categories (`/categories`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | ❌ | List all categories |
| GET | `/categories/age-ranges` | ❌ | List age ranges |

### Reviews (`/reviews`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reviews/product/:productId` | ❌ | Get product reviews |
| POST | `/reviews/order-items/:orderItemId` | 🔑 | Create review |

### Cart (`/cart`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cart` | 🔑 | Get cart |
| POST | `/cart/items` | 🔑 | Add item to cart |
| PATCH | `/cart/items/:productId` | 🔑 | Update item quantity |
| DELETE | `/cart/items/:productId` | 🔑 | Remove item |
| DELETE | `/cart` | 🔑 | Clear entire cart |

### Orders (`/orders`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | 🔑 | Place order |
| GET | `/orders` | 🔑 | List user's orders |
| GET | `/orders/:id` | 🔑 | Get order detail |
| PATCH | `/orders/items/:orderItemId/status` | 🔑🏪 | Update item status |

### Sellers (`/sellers`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/sellers` | ❌ | List all sellers |
| GET | `/sellers/:id` | ❌ | Get seller detail |
| POST | `/sellers/register` | 🔑 | Register as seller |
| GET | `/sellers/me/dashboard` | 🔑🏪 | Seller dashboard data |
| GET | `/sellers/me/stats` | 🔑🏪 | Seller statistics |
| GET | `/sellers/me/sales-report` | 🔑🏪 | Sales report |

### Admin (`/admin`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | 🔑👑 | Platform statistics |
| GET | `/admin/users` | 🔑👑 | List all users |
| GET | `/admin/shops` | 🔑👑 | List all shops |
| PATCH | `/admin/users/:id/status` | 🔑👑 | Toggle user status |
| PATCH | `/admin/shops/:id/status` | 🔑👑 | Toggle shop status |

**Legend:** ❌ = public, 🔑 = authenticated, 🏪 = seller role, 👑 = admin role

---

## 6. Frontend Pages

### Public Routes

| Route | Component | Data Source | Description |
|---|---|---|---|
| `/` | HomePage | Server fetch | Hero, category cards, age range cards, featured stores |
| `/products` | ProductsPage | Server fetch | Product grid with sidebar filters (category, age, store, search) |
| `/products/:id` | ProductDetailPage | Server fetch (cached) | Full product view with specs, seller card, add-to-cart |
| `/stores/:id` | StoreDetailPage | Server fetch | Store profile with product grid |
| `/auth/sign-in` | SignInPage | — | Login form with `from` redirect param |
| `/auth/register` | RegisterPage | — | Registration with role selection |

### Authenticated Routes (Customer)

| Route | Component | Data Source | Description |
|---|---|---|---|
| `/cart` | CartPage | Client query | Cart items, quantity controls, order summary |
| `/checkout` | CheckoutPage | Client query | Delivery address form, order summary, place order |
| `/orders` | OrdersPage | Server fetch | Tabbed order list (All/To Pay/To Ship/To Receive/Completed) |
| `/orders/:id` | OrderDetailPage | Server fetch | Full order detail with item statuses |
| `/profile` | ProfilePage | Client query | Edit profile form with avatar upload |

### Seller Routes

| Route | Component | Data Source | Description |
|---|---|---|---|
| `/seller/dashboard` | SellerDashboard | Client query | Sales stats, recent orders, product overview |
| `/seller/register` | SellerRegisterPage | — | Seller registration form |
| `/seller/products/new` | NewProductPage | — | Create product form |
| `/seller/products/:id/edit` | EditProductPage | Client query | Edit existing product |

### Admin Routes

| Route | Component | Data Source | Description |
|---|---|---|---|
| `/admin/dashboard` | AdminDashboard | Client query | Platform stats, user/shop management |

---

## 7. Authentication System

### JWT Flow
```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as Database

  C->>A: POST /auth/login {email, password}
  A->>DB: Verify credentials
  DB-->>A: User record
  A-->>C: {accessToken, refreshToken (httpOnly cookie), csrfToken}

  Note over C: Store accessToken in memory
  Note over C: Store csrfToken in sessionStorage

  C->>A: GET /products (+ Authorization header)
  A->>A: Validate JWT
  A-->>C: Product data

  C->>A: POST /auth/refresh (httpOnly cookie)
  A->>DB: Check refreshTokenVersion
  A-->>C: New accessToken
```

### Security Features
- **Access Token:** Short-lived JWT in Authorization header
- **Refresh Token:** httpOnly, Secure cookie — immune to XSS
- **CSRF Token:** Sent on login, stored in sessionStorage, validated on mutations
- **Password Hashing:** bcrypt with salt rounds
- **Token Versioning:** `refreshTokenVersion` on User model enables "logout all devices"

### Role-Based Access
- **Customer:** Browse, cart, checkout, orders, profile, reviews
- **Seller:** All customer features + product CRUD, dashboard, sales reports
- **Admin:** Platform-wide user/shop management, statistics

---

## 8. Design System

### Typography
| Token | Font | Usage |
|---|---|---|
| `--font-display` | Paytone One | Headings, display text |
| `--font-body` | Outfit | Body copy, form labels, buttons |
| `--font-brand` | Softers | Logo, brand accent text |

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#ff751f` | Primary brand orange |
| `--color-secondary` | `#dc8242` | Warm accent |
| `--color-tertiary` | `#7b715a` | Subtle neutral |
| `--color-bg` | `#ffffff` | Page background |
| `--color-text` | `#1a1a1a` | Primary text |
| `--color-text-muted` | `#555555` | Secondary text |
| `--color-cream` | `#fff4e8` | Card backgrounds |
| `--color-error` | `#c0392b` | Error states |
| `--color-success` | `#247348` | Success states |

### Age Range Accent Colors
| Token | Hex | Age Group |
|---|---|---|
| `--color-lemon` | `#ece4b7` | 0–2 Years |
| `--color-peach` | `#fbd1a2` | 3–5 Years |
| `--color-mint` | `#5ae79a` | 6+ Years |

### Spacing Scale
T-shirt sizing from `--space-xs` (8px) to `--space-3xl` (72px), with numeric aliases `--space-1` (4px) to `--space-24` (96px).

### Border Radii
From `--radius-sm` (6px) for small elements to `--radius-xl` (25px) for product cards and `--radius-full` (pill shapes).

### Accessibility
- **Minimum tap target:** 44px (`--tap-target`)
- **WCAG 2.1 AA** compliant contrast ratios
- **rem-based font sizing** (16px base)
- Semantic HTML (headings, landmarks, ARIA labels)

---

## 9. Component Catalog

### Layout Components
| Component | Path | Description |
|---|---|---|
| `Navbar` | `components/layout/navbar.tsx` | Main navigation with auth-aware links, mobile menu |
| `Footer` | `components/layout/footer.tsx` | Site footer |
| `ProfileSidebar` | `components/profile/profile-sidebar.tsx` | Sidebar nav for profile/orders |

### Catalog Components
| Component | Path | Description |
|---|---|---|
| `ProductCard` | `components/catalog/product-card.tsx` | Product grid card with image, name, price |
| `CatalogNavSidebar` | `components/catalog/catalog-nav-sidebar.tsx` | Filter sidebar (categories, age ranges, stores) |
| `AddToCartButton` | `products/[id]/add-to-cart-button.tsx` | Client component with auth check + cart mutation |

### UI Primitives
| Component | Path | Description |
|---|---|---|
| `Button` | `components/ui/button/button.tsx` | Primary/secondary/ghost variants |
| `Input` | `components/ui/input/input.tsx` | Form input with label |
| `Skeleton` | `components/ui/skeleton/skeleton.tsx` | Loading placeholder |

### Home Page Sections
| Component | Path | Description |
|---|---|---|
| `HeroSection` | `app/(main)/sections/hero-section.tsx` | Hero banner |
| `CategoryCards` | `app/(main)/sections/category-cards.tsx` | Category browsing cards |
| `AgeRangeCards` | `app/(main)/sections/age-range-cards.tsx` | Age group browsing cards |
| `FeaturedStores` | `app/(main)/sections/featured-stores.tsx` | Store discovery section |

---

## 10. Data Flow

### Server Component Flow (Products, Stores, Orders)
```
1. Next.js page function calls fetch() to API
2. Response is cached via { next: { revalidate: 60 } }
3. Data is passed as props to child components
4. No client JavaScript needed — pure HTML streamed to browser
```

### Client Component Flow (Cart, Checkout, Profile)
```
1. Component uses useQuery() from @tanstack/react-query
2. apiClient (axios) sends request with JWT in Authorization header
3. CSRF token included in X-CSRF-Token header for mutations
4. Response cached in React Query cache with configurable staleTime
5. Mutations use useMutation() with optimistic updates where appropriate
```

### Seed Data Pipeline
```
1. prisma/seed.ts defines categories, age ranges, sellers, products
2. Products use curated image URLs and realistic pricing
3. Test accounts created: customer (test@test.com) + seller
4. Run via: npm run db:seed
```

---

## 11. Test Strategy

### E2E Tests (Playwright)
- **File:** `apps/web/e2e/customer-flow.spec.ts`
- **Coverage:** Unauthenticated browsing, sign-in, cart CRUD, checkout, orders, profile
- **Browsers:** Chromium, Firefox, Mobile Safari
- **Auth:** Setup tests authenticate as customer/seller, state saved to files
- **Run:** `npx playwright test --project=chromium`

### Unit Tests (Jest)
- **Location:** `apps/api/src/**/*.spec.ts`
- **Coverage:**
  - `products.service.spec.ts` — CRUD, pagination, search
  - `cart.service.spec.ts` — add/update/remove items
  - `orders.service.spec.ts` — order placement, commission, stock decrement
  - `sellers.service.spec.ts` — registration, dashboard stats
  - `reviews.service.spec.ts` — create review, duplicate prevention
  - `auth.service.spec.ts` — login, registration, token refresh
  - `admin.service.spec.ts` — user/shop management, stats
  - `users.service.spec.ts` — profile read/update
  - `api-performance.spec.ts` — response time benchmarks
- **Run:** `cd apps/api && npm test`

---

## 12. Environment Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- MySQL/MariaDB running locally

### Environment Variables

**`apps/api/.env`:**
```
DATABASE_URL="mysql://user:password@localhost:3306/artistryx"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
CORS_ORIGIN="http://localhost:3010"
PORT=3000
ORDERS_COMMISSION_RATE=0.05
```

**`apps/web/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development Commands
```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd apps/api && npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npm run db:seed

# Start API server (port 3000)
npm run start:dev

# Start web frontend (port 3010)
cd apps/web && npm run dev

# Run E2E tests
npx playwright test

# Run API unit tests
cd apps/api && npm test
```

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Age Range** | Product classification (0–2, 3–5, 6+) to guide parents |
| **Category** | High-level product grouping (e.g., STEM Kits, Story Books) |
| **Seller** | Independent store owner listing products on the platform |
| **Commission** | Platform fee (default 5%) earned from each sale |
| **Soft Delete** | Setting status to Unavailable rather than physical deletion |
| **Server Component** | Next.js component that renders on the server (no client JS) |
| **Client Component** | Next.js component with `'use client'` directive for interactivity |
| **CSRF Token** | Cross-Site Request Forgery token for mutation security |
| **Design Token** | CSS custom property defining a design system value |
