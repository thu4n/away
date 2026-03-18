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
├── public/                   # Static assets (favicon, images)
├── src/
│   ├── assets/               # Astro-processed assets
│   ├── components/           # Reusable Astro/React components (currently empty)
│   ├── layouts/
│   │   └── Layout.astro      # Base HTML shell, nav bar, global <head>
│   ├── pages/
│   │   ├── index.astro       # Home page — trip list + create trip form
│   │   ├── trip/
│   │   │   └── [id].astro    # Trip detail — timeline & expenses tabs
│   │   └── api/
│   │       ├── trips.ts      # CRUD API for trips
│   │       ├── timeline.ts   # CRUD API for timeline items
│   │       ├── expenses.ts   # CRUD API for expenses (handles image upload)
│   │       └── images/
│   │           └── [...key].ts # Proxy to serve images from R2
│   └── styles/
│       └── global.css        # CSS custom properties, Tailwind import, global styles
├── schema.sql                # D1 database schema (DDL)
├── seed.sql                  # Sample data for development
├── astro.config.mjs          # Astro configuration
├── wrangler.jsonc            # Cloudflare Workers / D1 configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

---

## Request Flow

The app is **fully server-rendered** — there is no client-side routing or SPA behavior.

```
Browser ──GET /trip/1──▶ Cloudflare Worker (Astro SSR)
                              │
                              ├── Query D1 (trips, timeline_items, expenses)
                              ├── Render [id].astro with data
                              └── Return full HTML page

Browser ──POST /api/timeline──▶ API route handler (timeline.ts)
                                     │
                                     ├── Parse FormData
                                     ├── Execute SQL (INSERT/UPDATE/DELETE)
                                     └── 302 Redirect back to trip page

Browser ──POST /api/expenses──▶ API route handler (expenses.ts)
                                     │
                                     ├── Parse Multipart FormData (includes proof_image)
                                     ├── Save binary to R2 (BUCKET binding)
                                     ├── Save object key to D1 (image_key column)
                                     └── 302 Redirect back to expenses tab

Browser ──GET /api/images/X──▶ Image proxy endpoint ([...key].ts)
                                     │
                                     ├── Fetch object from R2
                                     └── Return binary with proper Content-Type
```

All form submissions use standard `<form method="POST">` with a `302 redirect` response. This means the page **fully reloads** after every create / edit / delete action.

---

## Database Schema

Three tables with foreign key relationships:

```
trips (1) ──▶ (N) timeline_items
trips (1) ──▶ (N) expenses
timeline_items (1) ──▶ (N) expenses  (optional link)
```

See [`schema.sql`](../schema.sql) for the full DDL. Key details:

- `timeline_items.trip_id` — `ON DELETE CASCADE` (deleting a trip removes its events)
- `expenses.trip_id` — `ON DELETE CASCADE` (deleting a trip removes its expenses)
- `expenses.timeline_item_id` — `ON DELETE SET NULL` (deleting an event unlinks, but keeps, the expense)
- `expenses.image_key` — Stores the path in R2 (e.g., `expenses/1-12345678-receipt.jpg`)

---

## Core Pages

### `index.astro` — Trip Dashboard
- Lists all trips ordered by start date
- "Plan a New Trip" form at the bottom
- Edit button (pencil icon) on each trip card → opens Edit Trip dialog
- Edit Trip dialog has both **Save Changes** and **Delete Trip** actions

### `trip/[id].astro` — Trip Detail
- **Timeline tab**: Day-based pill navigation, vertical timeline with event cards
- **Expenses tab**: Summary banner, date filter pills, expense list
- Bottom-sheet dialogs for adding/editing events and expenses
- All edit dialogs include a **Delete** action

### API Routes (`src/pages/api/`)
Each API file handles 3 actions via a hidden `action` form field:
- No action / default → **Create** (INSERT)
- `action=edit` → **Update** (UPDATE)
- `action=delete` → **Delete** (DELETE)
