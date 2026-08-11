# GitHub Projects & Issues Workflow Rule

This rule defines how developers and AI agents interact with GitHub Issues and GitHub Projects for the `thu4n/away` repository.

## GitHub CLI (`gh`) Setup & Scopes
AI agents and developers interact with GitHub via the `gh` CLI. To manage GitHub Projects (V2), ensure `project` and `read:project` scopes are enabled:
```bash
gh auth refresh -s project,read:project
```

## Issue & Project Management Commands

### 1. View & Track Issues
```bash
# List open feature issues
gh issue list --repo thu4n/away --state open

# View issue details
gh issue view <issue_number>
```

### 2. GitHub Projects V2 Integration
```bash
# Create a new GitHub Project for tracking
gh project create --owner thu4n --title "Away Feature Roadmap"

# List project items
gh project item-list <project_number> --owner thu4n

# Add an issue to GitHub Project
gh project item-add <project_number> --owner thu4n --url https://github.com/thu4n/away/issues/<issue_number>

# Edit item status (e.g., Todo -> In Progress -> Done)
gh project item-edit --id <item_id> --field-id <status_field_id> --single-select-option-id <option_id> --project-id <project_id>
```

## Current Project Backlog
- [#8: feat: Add Vietnamese language support (i18n)](https://github.com/thu4n/away/issues/8)
- [#9: feat: Add manual Theme Switcher (Light / Dark / System)](https://github.com/thu4n/away/issues/9)
- [#10: feat: Group Expense Bill Splitting & Settlement Summary](https://github.com/thu4n/away/issues/10)
- [#11: feat: Multi-Currency Support for Trips & Expenses (SGD, USD, VND)](https://github.com/thu4n/away/issues/11)
- [#12: feat: Optional Target Trip Budget & Spend Progress Bar](https://github.com/thu4n/away/issues/12)
