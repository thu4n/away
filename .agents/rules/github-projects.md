# GitHub Projects & Issues Workflow Rule

This rule defines how AI agents and developers dynamically interact with GitHub Issues and GitHub Projects for the `thu4n/away` repository via `gh` CLI.

## GitHub CLI (`gh`) Setup & Scopes
To manage GitHub Projects (V2), ensure `project` and `read:project` scopes are enabled:
```bash
gh auth refresh -h github.com -s project,read:project
```

## Dynamic Issue & Project Workflow

### 1. Inspect Current Issues
Always run `gh issue list` to inspect live open issues instead of relying on static documentation:
```bash
# List open feature issues
gh issue list --repo thu4n/away --state open

# View specific issue details
gh issue view <issue_number>
```

### 2. GitHub Projects V2 Tracking
```bash
# List items in project
gh project item-list <project_number> --owner thu4n

# Add issue to GitHub Project
gh project item-add <project_number> --owner thu4n --url https://github.com/thu4n/away/issues/<issue_number>

# Update item status (e.g. Todo -> In Progress -> Done)
gh project item-edit --id <item_id> --field-id <status_field_id> --single-select-option-id <option_id> --project-id <project_id>
```
