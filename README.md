# ✈️ Away

A mobile-first trip planner and tracker built for small groups. Organize itineraries, track expenses with photo proof, and store trip resources in one sapphire-themed spot.

## Core Features

- **Vertical Timeline** — Day-by-day activity tracking with native map integration.
- **Expense Ledger** — Log costs and upload receipt photos securely to Cloudflare R2.
- **Resources Hub** — Save useful travel links and embed YouTube/Instagram content.
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
- **[GitHub Projects & Roadmap](./docs/github-projects.md)** — Feature issues, roadmap backlog, and GitHub CLI workflow.

---

## Infrastructure & Deployment (Production)

This project separates infrastructure provisioning from application deployment. It uses **Terraform** to scaffold backend resources and **Cloudflare Wrangler** to manage the Astro application code and assets.

If you are deploying this for your own web app, follow these steps:

### 1. Provision Infrastructure
First, configure your deployment credentials by copying the environment template:

```bash
cp .env.example .env
# Open .env and fill in your Cloudflare and AWS/R2 credentials
```

Then, navigate to the `infra/` folder, load your environment variables, and use Terraform to instantiate your Cloudflare D1 database, R2 bucket, and the empty Worker shell container:

```bash
cd infra/
export $(grep -v '^#' ../.env | xargs)
terraform init
terraform plan
terraform apply
```

### 2. Deploy Application Code
Once Terraform finishes, grab your new Database ID and Bucket name, and update them in the top-level `wrangler.jsonc`. Then, let Wrangler build the Astro app and deploy the source code into your Worker:

```bash
cd ../
npm install
npm run build
npx wrangler deploy
```

---

## Local Development Quick Start

```bash
npm install
npx wrangler d1 execute away-db --local --file=schema.sql
npx wrangler d1 execute away-db --local --file=seed.sql
npm run dev
```

Visit **http://localhost:8787** to start planning.
