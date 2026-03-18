# Known Bugs & Gotchas

This document catalogs common issues you may encounter when developing Away and how to resolve them.

---

## 1. `ENOENT: no such file or directory, scandir 'dist/client'`

**When:** Running `npm run dev` and saving a source file while the server is live.

**Why:** The `dev` script runs `astro build && wrangler dev`. When wrangler detects a file change, it tries to hot-reload but looks for a `dist/client/` directory that doesn't exist (because the Cloudflare adapter produces server-only output).

**Fix:** Stop the dev server (`Ctrl+C`) and re-run `npm run dev`. This is a wrangler quirk, not a code bug.

---

## 2. `ReferenceError: Cannot access 'X' before initialization`

**When:** Using a `const` arrow function before it's defined in the Astro frontmatter.

**Why:** Unlike `function` declarations, `const` arrow functions are **not hoisted** in JavaScript. Astro's frontmatter runs top-to-bottom alphabetically.

**Example of the bug:**
```typescript
// ❌ This will crash — formatDate is used before it's defined
const dayTabs = items.map(i => formatDate(i.date));

const formatDate = (date: string) => { /* ... */ };
```

**Fix:** Always define helper functions **above** where they are first used:
```typescript
// ✅ Define the helper first
const formatDate = (date: string) => { /* ... */ };

const dayTabs = items.map(i => formatDate(i.date));
```

---

## 3. TypeScript: `Conversion of type 'HTMLElement | null' to type 'HTMLSelectElement' may be a mistake`

**When:** Casting `document.getElementById()` results in `<script>` blocks inside `.astro` files.

**Why:** TypeScript doesn't know what element type `getElementById` will return. For `<select>` elements specifically, the overlap between `HTMLElement` and `HTMLSelectElement` isn't direct enough.

**Fix:** Use the double-cast pattern:
```typescript
// ❌ This will produce a lint warning
(document.getElementById('my-select') as HTMLSelectElement).value = 'foo';

// ✅ This satisfies TypeScript
(document.getElementById('my-select') as unknown as HTMLSelectElement).value = 'foo';
```

For `HTMLInputElement` and `HTMLTextAreaElement`, the single cast usually works fine.

---

## 4. Form Action Switching (Edit + Delete in Same Form)

**When:** The edit dialogs contain both "Save Changes" and "Delete" buttons that share the same `<form>`.

**How it works:** A hidden `<input name="action">` field's value is toggled by the button's `onclick` handler before submission:

```html
<input type="hidden" name="action" id="edit-event-action" value="edit" />

<!-- Save button -->
<button onclick="document.getElementById('edit-event-action').value='edit'; return confirm('Save?');">
  Save Changes
</button>

<!-- Delete button -->
<button onclick="document.getElementById('edit-event-action').value='delete'; return confirm('Delete?');">
  Delete
</button>
```

**Gotcha:** If you add `formnovalidate` to the delete button, make sure the hidden `action` value is always set *before* `confirm()` is called. If the user cancels the confirm dialog, the `action` value may still be set to `'delete'` — but since the form doesn't submit, this is harmless (it resets on the next button click).

---

## 5. Day Tabs Showing Incorrect Dates

**When:** The trip's start date is stored in a timezone-sensitive format.

**Why:** `new Date('2026-04-10')` is parsed as midnight UTC. If your local timezone is ahead of UTC, `getDate()` may return the previous day.

**Current status:** The dates in D1 are stored as plain `DATE` strings (`'2026-04-10'`), and `new Date()` parsing works correctly in the Cloudflare Workers runtime. But be aware of this if you start storing timestamps.

---

## 6. Expenses Not Sorted After Editing

**When:** After editing an expense's date, it may appear in the wrong position.

**Why:** The page performs a full reload after editing (302 redirect), so the SQL `ORDER BY expense_date DESC` re-sorts correctly. This is only a problem if you implement client-side updates in the future without re-querying.

---

## 8. Missing Image Uploads (Missing `enctype`)

**When:** Submitting a form with a `<input type="file">` but the server receives an empty file or just the filename string.

**Why:** By default, HTML forms use `application/x-www-form-urlencoded`. To send binary data (files), you **must** specify `multipart/form-data`.

**Fix:** Ensure the `<form>` tag has the correct encryption type:
```html
<form method="POST" action="/api/expenses" enctype="multipart/form-data">
```
