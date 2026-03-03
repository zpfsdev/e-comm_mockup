## Artistryx Web Frontend (`apps/web`)

React and Next.js frontend for the Artistryx marketplace. Implements the customer, seller, and admin user interfaces, including home page, catalog, authentication, cart, checkout, orders, dashboards, and profile management.

---

### Tech stack

- Framework: Next.js App Router with React  
- Language: TypeScript  
- Styling: CSS Modules with design tokens (`tokens.css`)  
- Data fetching: TanStack Query with a shared `apiClient` wrapper  
- State: React context for auth, React Query for server state  

---

### Application structure

- `src/app/`
  - `(main)/` – primary pages using the shared layout (home, products, cart, checkout, orders, profile, dashboards)  
  - `auth/` – sign-in and sign-up flows without the main navbar/footer  
  - `proxy.ts` – route protection and redirects at the edge  
- `src/components/`
  - `layout/` – navbar, footer, layout wrappers  
  - `ui/` – base components (button, input, card, badge, skeleton, avatar)  
- `src/lib/` – `api-client`, shared constants, utility functions  
- `src/providers/` – `AuthProvider` and `QueryProvider`  
- `src/app/globals.css` and `src/styles/tokens.css` – global resets and design tokens  

---

### Running the frontend locally

From the repo root:

```bash
cd apps/web

# development
pnpm dev

# production build
pnpm build
pnpm start
```

The development server listens on port 3000.

---

### Environment configuration

Frontend configuration is read from `.env.local` in `apps/web`:

- `NEXT_PUBLIC_API_URL` – base URL for backend API calls (for example, the `/api/v1` prefix of the Artistryx API)

This value is used by `src/lib/api-client.ts` to construct request URLs.

---

### Auth and data fetching

- Auth state is managed by `AuthProvider` using a short‑lived access token and a session cookie.  
- API calls are made through `apiClient`, which attaches the access token and handles automatic refresh on 401 responses.  
- React Query is used throughout for data fetching, caching, and error/loading states with query keys such as `['products', params]`, `['cart']`, `['orders']`, and `['profile']`.

---

### Key routes and pages

- `/` – marketing home page with hero, featured products and categories  
- `/products` – catalog with filters, search, and pagination  
- `/products/[id]` – product detail page  
- `/cart` – current user cart with quantity controls and order summary  
- `/checkout` – checkout form using cart contents and shipping details  
- `/orders` and `/orders/[id]` – order list and detail views  
- `/profile` – profile view and editing  
- Seller and admin dashboards – routes under the main route group for role-specific management views  
- `/auth/sign-in` and `/auth/sign-up` – authentication flows

Protected routes rely on both client-side auth state and backend authorization; unauthenticated users are redirected to the sign-in flow with a preserved return path.

---

### Testing

From `apps/web`:

```bash
# unit and component tests with Jest and React Testing Library
pnpm test

# end-to-end tests with Playwright
pnpm test:e2e
```

Component tests cover core UI such as the navbar, add-to-cart interactions, and the cart page.  
Playwright tests cover end-to-end user journeys across browsing, cart, checkout, and authentication.

