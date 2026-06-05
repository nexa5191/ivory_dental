# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm start        # Run production server
npm run lint     # ESLint via Next.js
```

**Environment:** Copy `.env` to `.env.local`. Set `GST_API_KEY` for live GST lookups (AppyFlow); without it, all lookups return deterministic mock data. `DATABASE_URL` (pooled) and `DIRECT_URL` (session-mode, for migrations) target Supabase Postgres.

## Architecture

### Data Layer — Two Tiers

1. **Mock singletons (active)** — `lib/clinic.ts`, `lib/store.ts`, `lib/vendors.ts`, `lib/compliance.ts`, etc. In-memory module-level globals that reset on server restart. All API routes and pages currently read/write these.
2. **Prisma schema (not yet wired)** — `prisma/schema.prisma` defines the full PostgreSQL domain. `app/generated/prisma/` is the generator output directory (empty until `npx prisma generate` is run). There are no migrations yet.

**Money convention:** All amounts are stored and computed in USD. The `<Money>` component and `lib/currency.ts` (`formatMoney`, `formatCompact`) convert at display time. INR compact format uses Lakh/Crore.

### Domains

| Domain | Lib file | Components |
|--------|----------|------------|
| Clinic (providers, patients, appointments, dental charts, prescriptions, visits, invoices) | `lib/clinic.ts` | `components/clinic/` |
| Inventory (products, suppliers, stock by location, movements, orders) | `lib/store.ts` | `components/products/` |
| Procurement (vendors, RFQs, quotes, purchase orders, goods receipts, vendor invites) | `lib/vendors.ts` | `components/clinic/procurement-client.tsx`, `components/clinic/vendors-client.tsx` |
| GST/Tax (compliance ledger, GSTR-1, ITC, TDS, cash/credit ledgers, job-work challans) | `lib/gst.ts`, `lib/gst-api.ts`, `lib/compliance.ts` | `components/clinic/tax-client.tsx` |

### API Routes

All routes in `app/api/` are thin pass-throughs to the lib functions above — no DB queries. Pattern: `app/api/{domain}/route.ts` handles GET (list) and POST (create); `app/api/{domain}/[id]/route.ts` handles GET/PUT/DELETE by id.

Notable routes:
- `POST /api/gst/lookup { gstin }` — live AppyFlow lookup or deterministic mock fallback
- `POST /api/stock/movements` — adjusts in-memory stock (in/out/transfer/writeoff)
- `/api/procurement/rfqs/[id]/send|quote|award` — RFQ state machine steps

### Component Patterns

- `components/ui/` — Primitive building blocks (Button, Card, Input, Badge, Sheet, Money, FlipCard)
- `components/shell/` — App shell: sidebar, topbar, page header, nav items
- `components/theme/` — HSL color studio, font selector, theme provider
- `*-client.tsx` suffix — Client Components (`"use client"`) handling local state, modals, filters
- No prop drilling; each page/client component manages its own state with `useState`

### Theme Engine

CSS variables drive the entire palette. `lib/theme.ts` converts HSL (hue + saturation + lightness sliders) and a radius value into Tailwind-compatible CSS custom properties, plus a 5-color chart palette (analogous + complementary offsets). Dark mode is stored in localStorage and injected before paint to avoid flash. Font selection (Inter, Manrope, Plus Jakarta Sans, Lora, JetBrains Mono, System UI) is also localStorage-persisted via `components/theme/theme-provider.tsx`.

### Public Vendor Routes

`/vendor-portal/[token]` and `/vendor-register/[token]` are unauthenticated routes. Vendors receive a token via invite; the token is the `VendorInvite.token` key and is used to look up and register the vendor without any login.

## Key Files

| File | Purpose |
|------|---------|
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge), currency/date helpers, relative time |
| `lib/currency.ts` | `formatMoney`, `formatCompact` (INR Lakh/Crore, K/M for others) |
| `lib/theme.ts` | `applyTheme()`, `applyMode()`, `hslString()`, chart palette derivation |
| `lib/gst.ts` | Indian state table, PAN-from-GSTIN, mock GSTIN dataset |
| `lib/gst-api.ts` | Server-side resolver: real AppyFlow call or mock; never called client-side |
| `lib/compliance.ts` | Per-document compliance state: GSTR-1 filed, ITC claimed, TDS deposited, audit trail |
| `lib/mock-data.ts` | Seed arrays for products, suppliers, warehouses, orders |
| `components/shell/nav-items.ts` | Navigation menu definition and active-link detection |
| `components/shell/app-shell.tsx` | Root layout wrapper (sidebar + topbar + page slot) |
| `tailwind.config.ts` | Custom color tokens (background, foreground, primary, muted, accent, success, warning, danger), animations |
| `app/globals.css` | HSL CSS custom properties, dark mode overrides, scrollbar-thin, flip-card, studio-range utilities |
| `prisma/schema.prisma` | Complete PostgreSQL schema (not yet integrated); models mirror the lib singletons exactly |

## Adding a New Feature

1. Add types and CRUD helpers to the relevant `lib/*.ts` singleton.
2. Create `app/api/{feature}/route.ts` (and `[id]/route.ts` if needed) as thin wrappers.
3. Build a `*-client.tsx` Client Component under `components/clinic/` or `components/{feature}/`.
4. Add a page at `app/{feature}/page.tsx` that fetches and passes data to the client component.
5. Register the nav entry in `components/shell/nav-items.ts`.
