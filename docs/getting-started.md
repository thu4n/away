# Getting Started

## Prerequisites

- **Node.js** ≥ 22.12.0
- **npm** (comes with Node.js)
- **Wrangler CLI** — installed automatically as a dev dependency, but you can also install it globally: `npm install -g wrangler`

## 1. Install Dependencies

```bash
npm install
```

## 2. Initialize the Local Database

Away uses **Cloudflare D1** (SQLite-based) and **Cloudflare R2** (S3-compatible storage). For local development, Wrangler emulates both automatically.

1. **Initialize the Database:**
   ```bash
   # Create the schema
   npx wrangler d1 execute away-db --local --file=schema.sql

   # Populate with sample data
   npx wrangler d1 execute away-db --local --file=seed.sql
   ```

2. **Initialize R2 Storage:**
   Local R2 storage is created on-the-fly when you first upload a file via `npm run dev`. You don't need to run a manual create command for local buckets.

> **Tip:** If you ever need a fresh database, just re-run both commands. `schema.sql` already contains `DROP TABLE IF EXISTS` statements.

## 3. Run the Dev Server

The `dev` script performs **two steps in sequence**: it builds the Astro project, then starts a local Wrangler dev server.

```bash
npm run dev
```

The app will be available at **http://localhost:8787**.

### Common Startup Error

If wrangler crashes with:

```
ENOENT: no such file or directory, scandir '/path/to/away/dist/client'
```

This happens when the dev server auto-reloads because a file was saved while it was already running. **The solution is simply to stop the server (Ctrl+C) and re-run `npm run dev`.** This is a known wrangler quirk with the Astro + Cloudflare adapter — the build produces a server-only output, but wrangler briefly looks for a `dist/client/` directory during hot-reload.

## 4. Build Only (No Dev Server)

```bash
npm run build
```

This creates the production output in `dist/`. Useful for verifying that the project compiles before pushing changes.

## 5. Deploy to Cloudflare

```bash
npx wrangler deploy
```

Make sure you've configured `wrangler.jsonc` with a real `database_id` for your D1 database before deploying.
