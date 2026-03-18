# ✈️ Away

A mobile-first trip planner and tracker built for a small group of travelers. Track itineraries with a timeline, log expenses, and open locations directly in your native map app.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build) v6 (SSR mode) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Runtime | Cloudflare Workers (via `@astrojs/cloudflare`) |

## Features

- **Trip Dashboard** — View all trips at a glance
- **Vertical Timeline** — Activities organized by Day and Time, with map links that open the native maps app on mobile
- **Expense Ledger** — Log costs per trip, optionally linked to a specific timeline event
- **Mobile-First Design** — Sticky bottom nav, touch-friendly inputs, glassmorphism dark/light mode

## Local Development

### Prerequisites

- Node.js ≥ 22.12
- A Cloudflare account (for wrangler authentication)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate TypeScript types from wrangler bindings
npx wrangler types

# 3. Initialize the local D1 database with the schema
npx wrangler d1 execute away-db --local --file=./schema.sql

# 4. (Optional) Seed with sample data
npx wrangler d1 execute away-db --local --file=./seed.sql

# 5. Build and start the local dev server
npm run dev
```

Open **http://localhost:8787** in your browser.

> **Note:** `npm run dev` runs `astro build && wrangler dev`. This is intentional — it uses Cloudflare's `workerd` runtime locally so that D1 bindings and `import { env } from "cloudflare:workers"` work correctly.

## Database Schema

The schema is defined in [`schema.sql`](./schema.sql):

- **`trips`** — Trip name, start/end dates
- **`timeline_items`** — Per-trip events with day number, time mark, title, optional Google Maps URL and notes
- **`expenses`** — Per-trip costs with optional link to a timeline item

To reset the local database:

```bash
npx wrangler d1 execute away-db --local --file=./schema.sql
```

## Deploying to Cloudflare Pages

### 1. Create the D1 Database

```bash
npx wrangler d1 create away-db
```

Copy the `database_id` from the output and paste it into `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "away-db",
    "database_id": "YOUR_DATABASE_ID_HERE"  // <-- replace this
  }
]
```

### 2. Apply the Schema to the Remote Database

```bash
npx wrangler d1 execute away-db --remote --file=./schema.sql
```

### 3. Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist/
```

Or connect the repository to **Cloudflare Pages** in the dashboard and set the build command to `npm run build` with output directory `dist/`.

### 4. Link the D1 Binding

In the Cloudflare Pages dashboard:  
**Settings → Functions → D1 database bindings → Add binding**
- Variable name: `DB`
- D1 database: `away-db`

Redeploy after adding the binding.

## Project Structure

```
away/
├── schema.sql          # D1 database schema
├── seed.sql            # Sample data for local dev
├── wrangler.jsonc      # Cloudflare Workers/Pages config
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # Base layout with sticky nav
│   ├── pages/
│   │   ├── index.astro        # Trip dashboard
│   │   ├── trip/[id].astro    # Timeline & expenses view
│   │   └── api/
│   │       ├── trips.ts       # CRUD for trips
│   │       ├── timeline.ts    # CRUD for timeline items
│   │       └── expenses.ts    # CRUD for expenses
│   └── styles/
│       └── global.css         # Tailwind v4 + custom styles
```

## Free Tier Limits

This project is designed to stay within Cloudflare's free tier:

| Resource | Free Limit | Usage |
|---|---|---|
| D1 Storage | 5 GB | Minimal (text only) |
| D1 Reads | 5M / day | < 100 per page load |
| Pages Requests | 100k / day | Low-traffic personal use |
| Workers CPU | 10ms / request | Lightweight SSR |
