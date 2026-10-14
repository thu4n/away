# Project Architecture

## Tech Stack

| Layer        | Technology                                                     |
| ------------ | -------------------------------------------------------------- |
| Framework    | [Astro](https://astro.build) v6 (SSR mode)                    |
| Styling      | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Runtime      | [Cloudflare Workers](https://workers.cloudflare.com)           |
| Database     | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Storage      | [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible) |
| Font         | Inter (Google Fonts)                                           |
| Adapter      | `@astrojs/cloudflare`                                          |

React is available as an integration but **not currently used** for any components — all UI is built with Astro template syntax.

---

## Directory Structure

```
away/
├── docs/                     # Project documentation (you are here)
├── migrations/               # Sequential D1 SQL migrations
├── public/                   # Static assets (favicon, images)
├── src/
│   ├── assets/               # Astro-processed assets
│   ├── components/           # Reusable Astro/React components
│   ├── layouts/
│   │   └── Layout.astro      # Base HTML shell, nav bar, global <head>
│   ├── pages/
│   │   ├── index.astro       # Home page — trip list + create trip form
│   │   ├── trip/
│   │   │   └── [id].astro    # Trip detail — timeline, expenses, and resources tabs
│   │   └── api/
│   │       ├── trips.ts      # CRUD API for trips (handles R2 banner image upload)
│   │       ├── timeline.ts   # CRUD API for timeline items (handles R2 event photo upload)
│   │       ├── expenses.ts   # CRUD API for expenses (handles R2 proof image upload, payer, split)
│   │       ├── members.ts    # CRUD API for trip members (bill splitting participants)
│   │       ├── resources.ts  # CRUD API for trip resources
│   │       ├── export.ts     # CSV export for trip itinerary, expenses, and settlement plan
│   │       └── images/
│   │           └── [...key].ts # Proxy to serve trip, event, and expense images securely from R2
│   ├── styles/
│   │   └── global.css        # CSS custom properties, Tailwind v4 import, custom components
│   └── utils/
│       ├── currency.ts       # Currency symbols, formatting, conversion rates
│       └── settlement.ts     # Minimum cash-flow bill splitting & settlement calculator
├── schema.sql                # D1 database schema (DDL)
├── seed.sql                  # Sample data for development
├── astro.config.mjs          # Astro configuration
├── wrangler.jsonc            # Cloudflare Workers / D1 / R2 configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

---

## Request Flow

The app is **fully server-rendered** — there is no client-side routing or SPA behavior.

```
Browser ──GET /trip/1──▶ Cloudflare Worker (Astro SSR)
                              │
                              ├── Query D1 (trips, trip_members, timeline_items, expenses, trip_resources)
                              ├── Calculate net settlement transfers (settlement.ts)
                              ├── Render [id].astro with data
                              └── Return full HTML page

Browser ──POST /api/timeline──▶ API route handler (timeline.ts)
                                     │
                                     ├── Parse FormData
                                     ├── Execute SQL (INSERT/UPDATE/DELETE)
                                     └── 302 Redirect back to trip page & active day

Browser ──POST /api/expenses──▶ API route handler (expenses.ts)
                                     │
                                     ├── Parse Multipart FormData (includes proof_image, paid_by, split_among)
                                     ├── Save binary to R2 (BUCKET binding)
                                     ├── Save object key to D1 (image_key column)
                                     └── 302 Redirect back to expenses tab

Browser ──POST /api/members───▶ API route handler (members.ts)
                                     │
                                     ├── Parse FormData (add/delete/edit member names)
                                     └── 302 Redirect back to expenses tab

Browser ──GET /api/export?id=X─▶ CSV export handler (export.ts)
                                     │
                                     ├── Query trip details, timeline, expenses, members & settlement
                                     └── Return UTF-8 BOM CSV attachment
```

All form submissions use standard `<form method="POST">` with a `302 redirect` response. The page **fully reloads** after every create / edit / delete action. State is preserved across redirects via query parameters (e.g. `?tab=expenses`).

---

## Database Schema

Five tables with foreign key relationships:

```
trips (1) ──▶ (N) trip_members
trips (1) ──▶ (N) timeline_items
trips (1) ──▶ (N) expenses
trips (1) ──▶ (N) trip_resources
timeline_items (1) ──▶ (N) expenses  (optional link)
```

See [`schema.sql`](../schema.sql) for the full DDL. Key constraints:

- `trip_members.trip_id` — `ON DELETE CASCADE` (deleting a trip removes its members)
- `timeline_items.trip_id` — `ON DELETE CASCADE` (deleting a trip removes its events)
- `expenses.trip_id` — `ON DELETE CASCADE` (deleting a trip removes its expenses)
- `trip_resources.trip_id` — `ON DELETE CASCADE` (deleting a trip removes resources)
- `expenses.timeline_item_id` — `ON DELETE SET NULL` (deleting an event unlinks, but keeps, the expense)
- `trips.cover_image_key` — Stores trip customization banner in R2 (e.g., `trips/1-12345678-banner.jpg`)
- `timeline_items.image_key` — Stores event photo in R2 (e.g., `timeline/1-12345678-hotel.jpg`)
- `expenses.image_key` — Stores proof receipt in R2 (e.g., `expenses/1-12345678-receipt.jpg`)
- `expenses.paid_by` — Name of the trip participant who paid the expense
- `expenses.split_among` — JSON array of participant names sharing the cost (`'[]'` if not split with anyone / paid for team; defaults to all members if NULL for legacy records)
- `trips.target_budget` — Optional target spend budget in base currency (e.g. 15000000.0)

---

## Bill Splitting & Settlement Engine

Group expenses are settled using a minimum cash flow algorithm (`src/utils/settlement.ts`):
1. **Base Currency Conversion**: All foreign expenses are normalized to the trip's base currency using stored `base_amount`.
2. **Net Balance Calculation**: For each participant, `Net = Paid - Owed Share`.
3. **Debt Resolution**: Debtors (net < 0) and creditors (net > 0) are matched greedily to minimize the total number of transactions.
4. **Rounding**: Whole currency amounts for zero-decimal currencies (like VND) and 2-decimal rounding for others (USD, SGD, EUR).
5. **Shareable Breakdown**: Generates formatted plaintext summaries for one-click copy to messaging apps (WhatsApp, Telegram, Zalo).

---

## Core Pages

### `index.astro` — Trip Dashboard
- Lists all trips ordered by start date
- "Add Trip" form (with optional target budget & banner image)
- Edit button (pencil icon) on each trip card → opens Edit Trip dialog
- Edit Trip dialog has both **Save Changes** and **Delete Trip** actions

### `trip/[id].astro` — Trip Detail
- **Timeline tab**: Day-based pill navigation, vertical timeline with event cards
- **Expenses tab**: Summary banner with optional target budget progress bar (% spent, total spent, remaining budget, and over-budget warnings), filter pills (all/day), expense list supporting image proof modals, and Group Bill Splitting toolbar:
  - **Members modal**: Add/remove trip participants (supports comma-separated bulk entry).
  - **Split Bill / Settle Up modal**: Overview cards, member filter to view specific debtor payment transfers, net balances per member, and step-by-step transfer settlement instructions.
  - One-click clipboard copy of full or filtered settlement breakdown.
- **Resources tab**: Single-column flexible grid view for secure links, rendering embedded YouTube iframe players and Instagram posts
- Bottom-sheet dialogs for adding/editing events and expenses (with adaptive 2-column or compact multi-select dropdown for split attribution based on member count)

### API Routes (`src/pages/api/`)
Most API files handle standard actions via a hidden `action` form field:
- No action / default → **Create** (INSERT)
- `action=edit` → **Update** (UPDATE)
- `action=delete` → **Delete** (DELETE)
