# GitHub Projects & Issues Management

This document details how feature roadmaps, issue tracking, and GitHub Projects V2 are integrated into the **Away** development workflow.

## 📋 Backlog & Feature Issues

Feature requests and tasks are tracked via [GitHub Issues](https://github.com/thu4n/away/issues).

### Roadmap Backlog Issues

| Issue # | Title | Status |
| ------- | ----- | ------ |
| [#8](https://github.com/thu4n/away/issues/8) | `feat: Add Vietnamese language support (i18n)` | Open |
| [#9](https://github.com/thu4n/away/issues/9) | `feat: Add manual Theme Switcher (Light / Dark / System)` | Open |
| [#10](https://github.com/thu4n/away/issues/10) | `feat: Group Expense Bill Splitting & Settlement Summary` | Open |
| [#11](https://github.com/thu4n/away/issues/11) | `feat: Multi-Currency Support for Trips & Expenses (SGD, USD, VND)` | Open |
| [#12](https://github.com/thu4n/away/issues/12) | `feat: Optional Target Trip Budget & Spend Progress Bar` | Open |
| [#13](https://github.com/thu4n/away/issues/13) | `feat: User Authentication & Role-Based Trip Permissions via Google OAuth 2.0` | Open |

---

## 🛠 Working with GitHub CLI (`gh`)

### Required Token Scopes
To manage project boards via CLI, your GitHub token requires the `project` and `read:project` scopes:

```bash
gh auth refresh -h github.com -s project,read:project
```

### Common Commands

#### 1. Manage Issues
```bash
# List all open issues
gh issue list

# Create a new feature issue
gh issue create --title "feat: <title>" --body "<description>"

# View specific issue
gh issue view <issue_number>
```

#### 2. Manage GitHub Projects V2
```bash
# Create a new project board
gh project create --owner thu4n --title "Away Roadmap"

# Add an issue to a project
gh project item-add <project_number> --owner thu4n --url https://github.com/thu4n/away/issues/<issue_number>

# List items in a project
gh project item-list <project_number> --owner thu4n
```
