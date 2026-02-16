# Artistryx Web (Next.js)

Next.js frontend for Artistryx. Vanilla CSS (no Tailwind), design tokens, CSS Modules. Home, auth (sign-in/sign-up), shop, product detail, cart, profile, address, seller routes.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
├── app/                    App Router
│   ├── layout.tsx          Root layout (header, main, footer)
│   ├── layout.module.css  Wrapper and main flex
│   ├── page.tsx            Home page
│   ├── page.module.css    Home-only styles
│   ├── cart/
│   ├── profile/
│   ├── sign-in/
│   ├── sign-up/
│   ├── shop/
│   ├── product/[id]/
│   ├── address/
│   └── seller/start-selling/
├── components/             Shared UI
│   ├── site-header.tsx     Header (logo, nav)
│   ├── site-header.module.css
│   ├── site-footer.tsx     Footer (copyright)
│   ├── site-footer.module.css
│   └── icons.tsx           SVG icons
├── lib/
│   └── home-data.ts        Home page constants
└── styles/
    ├── variables.css       Design tokens
    ├── reset.css           Minimal reset
    └── globals.css         Body, .container, scrollbar
```

## Routes

- `/` – Home (hero, categories, age, top picks, what’s new, stores, nurture CTA)
- `/cart` – Cart (empty state)
- `/profile` – Profile
- `/sign-in`, `/sign-up` – Auth (no header)
- `/shop` – Shop listing (query params: category, age, store)
- `/product/[id]` – Product detail
- `/address` – My addresses
- `/seller/start-selling` – Seller onboarding

## Styling

- **Tokens:** `src/styles/variables.css` (colors, spacing, typography, radius).
- **Globals:** `src/styles/globals.css` (body, .container, scrollbar hidden, overflow).
- **Per-page:** CSS Modules (e.g. `page.module.css`). Header/footer use their own modules under `components/`.
- **Fonts:** Outfit (body), Paytone One (display), Nunito (nurture block) via `next/font/google` in `layout.tsx`.

## Adding a new page

1. Add a folder under `src/app/`, e.g. `src/app/my-page/`.
2. Add `page.tsx` (default export, optional `metadata`).
3. Page is wrapped by root layout (header + footer) automatically.
4. Use `className="container"` and shared tokens; add a `.module.css` if needed.

## Build

```bash
npm run build
```
