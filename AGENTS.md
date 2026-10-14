# 🤖 AI Agent Guidelines for Away Repository

Welcome AI pair programmers! When working on this repository, please adhere to the following workflow guidelines and tools.

## GitHub Project & Issues Integration

Always inspect open issues and update GitHub Projects when implementing features or fixing bugs:

1. **Check Open Roadmap Issues**:
   Run `gh issue list` to see current backlog items.
2. **Issue References in Commits**:
   Prefix commits with conventional commit tags and reference issue numbers (e.g. `feat: implement bill splitting logic (#10)`).
3. **GitHub Project CLI (`gh project`)**:
   Use `gh project` commands to track status transitions (`Todo` → `In Progress` → `Done`). If `read:project` / `project` scope is missing, prompt the user to refresh auth using `gh auth refresh -h github.com -s project,read:project`.

## Database & Migrations Workflow (Cloudflare D1)

- **Migration files**: Store sequential migrations in `migrations/` (e.g. `0001_multi_currency.sql`, `0002_trip_and_event_images.sql`).
- **Running migrations locally**:
  ```bash
  npx wrangler d1 execute away-db --local --file=migrations/<filename>.sql
  ```
- **Inspecting local schema**:
  ```bash
  npx wrangler d1 execute away-db --local --command "PRAGMA table_info(<table>);"
  ```
- **Base DDL sync**: Whenever creating a migration, always update `schema.sql` so that fresh databases initialized from `schema.sql` include all new columns and constraints.

## Bill Splitting & Multi-Currency Settlement Patterns

- **Participant Attribution**: Stored in `trip_members` (per-trip roster) and `expenses.paid_by` (payer name) / `expenses.split_among` (JSON array of member names).
- **Settlement Logic**: `src/utils/settlement.ts` normalizes all expenses to `base_currency` using stored `base_amount`, computes individual net balances, and runs a greedy minimum-transfers debt settlement algorithm.
- **CSV Export**: `src/pages/api/export.ts` outputs trip data, participant rosters, itemized expense splits, and settlement transfer instructions with UTF-8 BOM.

## Cloudflare R2 & Image Upload Patterns

- **Bucket Binding**: Access via `(env as any).BUCKET` in Astro API routes.
- **Key Namespacing**:
  - Trip Banners: `trips/${id}-${Date.now()}-${sanitizedFilename}` (`trips.cover_image_key`)
  - Timeline Event Photos: `timeline/${trip_id}-${Date.now()}-${sanitizedFilename}` (`timeline_items.image_key`)
  - Expense Receipts: `expenses/${trip_id}-${Date.now()}-${sanitizedFilename}` (`expenses.image_key`)
- **Serving Images**: Served via the image proxy route `src/pages/api/images/[...key].ts` at `/api/images/${key}`.
- **Form Requirements**: Any form with file inputs **must** include `enctype="multipart/form-data"`.
- **R2 Cleanup**: When updating/replacing or deleting items, delete old files from `bucket` using `await bucket.delete(key)`. On trip deletion, cascade delete the trip banner, timeline event photos, and expense receipts from R2.

## UI & Styling Conventions

- **Server-Side Rendered (SSR)**: Standard `<form method="POST">` submissions return 302 redirects preserving tab/day query params (e.g. `?tab=timeline&day=2`).
- **Design System**: Sapphire palette (`bg-sapphire`, `bg-ocean`, `bg-pale-sapphire`, `bg-whisper`, `bg-nightfall`) with Tailwind v4. See [`docs/styling-guide.md`](./docs/styling-guide.md).
- **Trip Banners**: Rendered as a top card header (`h-44 sm:h-52`) on `index.astro` and hero banner at the top of `/trip/[id]`.
- **Event Photos**: Rendered Agoda/Traveloka-style (`w-full h-44 sm:h-52 object-cover rounded-xl mt-3`) with hover zoom and link to view full resolution.
- **Modals**: Native `<dialog>` bottom-sheets. Edit dialogs toggle hidden `<input name="action">` between `edit` and `delete`.

## Terminal & Build Gotchas

- **Zsh bracket paths**: Filenames with brackets (like `src/pages/trip/[id].astro` or `src/pages/api/images/[...key].ts`) must be quoted in shell/git commands to prevent zsh globbing errors (e.g. `git add 'src/pages/trip/[id].astro'`).
- **Pre-commit Verification**: Run `npm run build` to verify Astro and TypeScript compile cleanly before finishing any task.
- **Never Push Without Permission**: Never run `git push` without explicit user permission.

## Documentation Reference
- [`docs/architecture.md`](./docs/architecture.md) — Tech stack & request flow
- [`docs/styling-guide.md`](./docs/styling-guide.md) — Sapphire design system & Tailwind v4
- [`docs/known-bugs.md`](./docs/known-bugs.md) — Gotchas & troubleshooting
- [`docs/getting-started.md`](./docs/getting-started.md) — Local setup & dev instructions
- [`.agents/rules/github-projects.md`](./.agents/rules/github-projects.md) — GitHub Projects & CLI workflow rule
