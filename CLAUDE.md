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

### Data Layer — Three Tiers

1. **Prisma DB (active for auth, doctors, patients)** — `src/lib/db/` holds thin query functions per domain. `src/lib/prisma.ts` is the Next.js global singleton. `src/app/generated/prisma/` is the Prisma client output. See migration status → [docs/mock-to-db-migration.md](docs/mock-to-db-migration.md).
2. **Mock singletons (active for all other domains)** — `lib/clinic.ts`, `lib/store.ts`, `lib/vendors.ts`, `lib/compliance.ts`. In-memory module-level globals that reset on server restart.
3. **Prisma schema** — `prisma/schema.prisma` defines the full PostgreSQL domain for all models. Single-tenant per deployment — no userId/tenantId scoping on entities; the DB is the tenant boundary.

**Money convention:** All amounts stored and computed in USD. `<Money>` component and `lib/currency.ts` (`formatMoney`, `formatCompact`) convert at display time. INR compact uses Lakh/Crore.

### DB Layer Architecture (pattern for all new Prisma migrations)

Follow this exact three-layer pattern when migrating a domain from mock to DB:

**Layer 1 — Query functions (`src/lib/db/<domain>.ts`)**
- Import from `@/lib/prisma` (never from `prisma-client.ts` at root — that's auth-only)
- One file per domain group (e.g. `appointments.ts`, `invoices.ts`)
- Export named functions: `list*`, `get*`, `create*`, `update*`, `delete*`
- No business logic, no HTTP — pure Prisma calls
- ID type: Prisma uses `Int` PKs; convert to `String` only at the page boundary

**Layer 2 — API routes (`src/app/api/<domain>/`)**
- `route.ts` — GET (list) + POST (create)
- `[id]/route.ts` — GET / PUT / DELETE by id
- Always include `parseId` guard for integer route params:
  ```ts
  function parseId(raw: string) {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
  ```
- Validate required fields on POST, return `400` for missing; `404` for not found; `204` for DELETE
- No business logic — call the `src/lib/db/` function and return JSON

**Layer 3 — Server components (`src/app/(main)/<domain>/page.tsx`)**
- Make the page `async`, import the `list*` function from `@/lib/db/`
- Map Prisma Int ids to `String(id)` before passing to client components
- Default missing relation counts to `0` until that relation is also migrated
- Client components (`*-client.tsx`) need no changes — they work on string IDs

### Domains

| Domain | Status | Lib file | Components |
|--------|--------|----------|------------|
| Clinic — providers (doctors) | **DB** | `lib/db/providers.ts` | `components/clinic/doctors-client.tsx` |
| Clinic — patients | **DB** | `lib/db/patients.ts` | `components/clinic/patients-client.tsx` |
| Clinic — appointments, prescriptions, visits, invoices, locations, leave | Mock | `lib/clinic.ts` | `components/clinic/` |
| Inventory — products, suppliers, stock, movements, orders | Mock | `lib/store.ts` | `components/products/` |
| Procurement — vendors, RFQs, quotes, POs, receipts, invites | Mock | `lib/vendors.ts` | `components/clinic/procurement-client.tsx` |
| GST/Tax — compliance, GSTR-1, ITC, TDS, cash/credit ledgers | Mock | `lib/gst.ts`, `lib/compliance.ts` | `components/clinic/tax-client.tsx` |

### API Routes

Routes in `src/app/api/` are thin pass-throughs — no business logic. Migrated domains call `src/lib/db/`; non-migrated domains still call the mock lib singletons.

Notable non-CRUD routes (keep as-is until GST/Procurement domains migrate):
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

CSS variables drive the entire palette. `lib/theme.ts` converts HSL sliders and a radius value into Tailwind-compatible CSS custom properties, plus a 5-color chart palette. Dark mode is stored in localStorage and injected before paint. Font selection is also localStorage-persisted via `components/theme/theme-provider.tsx`.

### Public Vendor Routes

`/vendor-portal/[token]` and `/vendor-register/[token]` are unauthenticated. Vendors receive a token via invite; the token is the `VendorInvite.token` key.

### Auth

better-auth with Prisma adapter. `src/lib/auth.ts` (server) uses `prisma-client.ts` at root. `src/lib/auth-client.ts` (client) uses `createAuthClient`. Middleware uses `betterFetch` to `/api/auth/get-session` (Edge Runtime safe — no PrismaClient import). Route group `(auth)` has no AppShell; `(main)` has AppShell + auth protection.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Next.js global Prisma singleton (for all API routes) |
| `src/lib/db/providers.ts` | Doctor/Provider Prisma query functions |
| `src/lib/db/patients.ts` | Patient Prisma query functions |
| `prisma-client.ts` | Root-level Prisma instance for auth only (has dotenv + eager connect) |
| `src/lib/auth.ts` | better-auth server config |
| `src/lib/auth-client.ts` | better-auth React client |
| `src/middleware.ts` | Session check via betterFetch; redirects unauthenticated to /login |
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge), currency/date helpers, relative time |
| `lib/currency.ts` | `formatMoney`, `formatCompact` (INR Lakh/Crore, K/M for others) |
| `lib/theme.ts` | `applyTheme()`, `applyMode()`, `hslString()`, chart palette derivation |
| `lib/gst.ts` | Indian state table, PAN-from-GSTIN, mock GSTIN dataset |
| `lib/gst-api.ts` | Server-side resolver: real AppyFlow call or mock; never called client-side |
| `lib/compliance.ts` | Per-document compliance state: GSTR-1 filed, ITC claimed, TDS deposited |
| `lib/mock-data.ts` | Seed arrays for products, suppliers, warehouses, orders |
| `components/shell/nav-items.ts` | Navigation menu definition and active-link detection |
| `components/shell/app-shell.tsx` | Root layout wrapper (sidebar + topbar + page slot) |
| `tailwind.config.ts` | Custom color tokens, animations |
| `app/globals.css` | HSL CSS custom properties, dark mode overrides, scrollbar, flip-card |
| `prisma/schema.prisma` | Complete PostgreSQL schema for all domains |

## Development AI Rules

- Never run npm/npx commands, Prisma migrations, or seed scripts — always instruct the user to run these themselves. Wait for them to confirm, then continue with implementation.
- When migrating a domain from mock to DB, read [docs/mock-to-db-migration.md](docs/mock-to-db-migration.md) first to understand what's pending and what the migration scope is for that domain.
- Follow the three-layer DB architecture pattern above exactly — query functions → API routes → server components.
