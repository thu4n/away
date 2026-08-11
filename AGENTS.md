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

## Documentation Reference
- [`docs/architecture.md`](./docs/architecture.md) — Tech stack & request flow
- [`docs/styling-guide.md`](./docs/styling-guide.md) — Sapphire design system & Tailwind v4
- [`docs/known-bugs.md`](./docs/known-bugs.md) — Gotchas & troubleshooting
- [`.agents/rules/github-projects.md`](./.agents/rules/github-projects.md) — GitHub Projects & CLI workflow rule
