# Getting Started

## Prerequisites

- **Node.js** ≥ 22.12.0
- **npm** (comes with Node.js)
- **Wrangler CLI** — installed automatically as a dev dependency, but you can also install it globally: `npm install -g wrangler`

## 1. Install Dependencies

```bash
npm install
```

## 2. Initialize the Local Databases

Away seamlessly meshes alongside **Cloudflare D1** (SQLite database) and **Cloudflare R2** (Blob Object Storage). For local development, Wrangler emulates both of these completely offline using `workerd` automatically.

1. **Initialize the Document Storage Database (D1):**
   ```bash
   # Execute schema to create tables structure locally
   npx wrangler d1 execute away-db --local --file=schema.sql

   # Populate with baseline sample data
   npx wrangler d1 execute away-db --local --file=seed.sql
   ```

2. **Initialize Object Storage Bucket (R2):**
   Local R2 storage architecture is instantiated on-the-fly when you first upload an Expense photo locally via `npm run dev` -- you do NOT need to execute a manual create command for the local buckets. It just works.

> **Tip:** If you ever need a fresh database wiping everything locally, just re-run the `schema.sql` command above, as it possesses `DROP TABLE IF EXISTS` operations.

## 3. Run the Dev Server

The `dev` script automatically launches **two concurrent environments in sequence**: compiling the Astro project, and instantiating the local Wrangler dev server.

```bash
npm run dev
```

The app will be booted up at **http://localhost:8787**.

### Common Startup Error

If wrangler crashes with:

```
ENOENT: no such file or directory, scandir '/path/to/away/dist/client'
```

This happens when the dev server auto-reloads because you hot-saved a file while the build was syncing. **The solution is to forcibly stop the server (Ctrl+C) and cleanly restart `npm run dev`.** This is extremely common with the Astro `+` Cloudflare adapter configuration since the compiler occasionally outruns Wrangler's cache.

## 4. Build Only (No Dev Server)

```bash
npm run build
```

This constructs a pure production output payload positioned in the `dist/` directory, perfect for validating that the project compiles safely prior to pushing any new features.

## 5. Deploy to Cloudflare

Deployment handles pushing the built bundles natively onto the Cloudflare Edge network.

```bash
npx wrangler pages deploy dist/
```

Make absolutely certain you have matched `wrangler.jsonc` structurally with your production `database_id` and production R2 `bucket_name` bindings.
