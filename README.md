# ✈️ Away

A mobile-first trip planner and tracker built for small groups. Organize itineraries, track expenses with photo proof, and store trip resources in one sapphire-themed spot.

## Core Features

- **Vertical Timeline** — Day-by-day activity tracking with native map integration.
- **Expense Ledger** — Log costs and upload receipt photos securely to Cloudflare R2.
- **Resources Hub** — Save useful travel links and embed YouTube/Instagram content.
- **Privacy First** — Discourages sharing sensitive document URLs through active security reminders.
- **Adaptive UI** — Smooth glassmorphism design that follows your system's light/dark mode.

## Tech Stack

- **Framework:** [Astro v6](https://astro.build) (SSR)
- **Runtime:** [Cloudflare Workers](https://workers.cloudflare.com)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)

---

## 📖 Documentation

For detailed technical guides, architecture deep-dives, and deployment steps, please refer to the **[docs/](./docs)** folder:

- **[Getting Started](./docs/getting-started.md)** — Installation, local development, and deployment.
- **[Architecture](./docs/architecture.md)** — Request flow, directory structure, and database schema.
- **[Styling & Theming](./docs/styling-guide.md)** — Customizing the Sapphire palette and typography.
- **[Known Bugs & Gotchas](./docs/known-bugs.md)** — Troubleshooting common development issues.

---

## Quick Start

```bash
npm install
npx wrangler d1 execute away-db --local --file=schema.sql
npm run dev
```

Visit **http://localhost:8787** to start planning.
