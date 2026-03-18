# Styling & Theming Guide

## How Styling Works

Away uses **Tailwind CSS v4** loaded via the Vite plugin. All Tailwind utility classes are available in `.astro` files directly.

Global styles and CSS custom properties live in:

```
src/styles/global.css
```

This file is imported by `Layout.astro` and applies to every page.

---

## Color Scheme

The color scheme is based on **CSS custom properties** combined with Tailwind classes.

### CSS Custom Properties (global.css)

```css
:root {
  --bg-color: #f8fafc;     /* Page background (light) */
  --card-bg: #ffffff;       /* Card backgrounds (light) */
  --text-color: #0f172a;    /* Primary text (light) */
  --accent: #3b82f6;        /* Accent / brand color (light) */
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #0f172a;    /* Page background (dark) */
    --card-bg: #1e293b;     /* Card backgrounds (dark) */
    --text-color: #f1f5f9;  /* Primary text (dark) */
    --accent: #60a5fa;      /* Accent / brand color (dark) */
  }
}
```

### Changing the Color Scheme

To change the overall look and feel, edit these custom properties in `src/styles/global.css`:

| What to change            | Where                                          | Example                     |
| ------------------------- | ---------------------------------------------- | --------------------------- |
| Page background           | `--bg-color`                                   | `#fefce8` (warm cream)      |
| Card / surface color      | `--card-bg`                                    | `#fffbeb`                   |
| Primary text              | `--text-color`                                 | `#1c1917`                   |
| Accent / brand color      | `--accent`                                     | `#f97316` (orange)          |
| Gradient on header        | `index.astro` → `bg-gradient-to-r from-* to-*` | Change Tailwind color names |
| Summary banner gradient   | `[id].astro` → `from-indigo-500 to-purple-600` | Change Tailwind color names |
| Primary action buttons    | Search for `bg-blue-600`                        | Replace with your color     |
| Danger / delete buttons   | Search for `bg-red-600`                         | Replace with your color     |

### Common Search-and-Replace Targets

If you want to rebrand from blue to, say, emerald green:

```bash
# In your editor, find and replace across all .astro files:
bg-blue-600  →  bg-emerald-600
bg-blue-700  →  bg-emerald-700
text-blue-600  →  text-emerald-600
text-blue-500  →  text-emerald-500
ring-blue-500  →  ring-emerald-500
from-blue-500 to-indigo-600  →  from-emerald-500 to-teal-600
```

> **Important:** Dark mode variants (`dark:bg-blue-900/20`, etc.) should be updated too.

---

## Dark Mode

Dark mode is **automatic** — it follows the user's system preference via `prefers-color-scheme: dark`. There is no manual toggle.

To add a manual toggle, you would need to:
1. Add a toggle button to `Layout.astro`
2. Use a `<script>` to toggle a `dark` class on `<html>`
3. Replace `@media (prefers-color-scheme: dark)` in `global.css` with `.dark` selectors
4. Configure Tailwind's `darkMode: 'class'` strategy 

---

## Typography

The app uses **Inter** from Google Fonts, loaded in `Layout.astro`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
```

To change the font:
1. Update the Google Fonts link in `src/layouts/Layout.astro`
2. Update the `font-family` in `src/styles/global.css` body rule

---

## Special CSS Classes

| Class           | Defined In     | Purpose                                         |
| --------------- | -------------- | ----------------------------------------------- |
| `.glassmorphism` | `global.css`  | Frosted glass effect for the bottom navbar       |
| `.scrollbar-none`| `global.css`  | Hides scrollbar on horizontal pill tab areas     |
| `dialog`         | `global.css`  | Bottom-sheet positioning + slide-up animation    |

---

## Currency Formatting

Expenses are formatted using the `Intl.NumberFormat` API:

```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
```

To change the currency:
1. Update the `currency` in `trip/[id].astro` → `formatCurrency` function
2. Update the Dong symbol `₫` in the expense form input decorators
3. Consider changing the `step` attribute on `<input type="number">` (currently `step="1000"` for VND)

---

## Date Formatting

All dates are displayed in **DD/MM/YYYY** format using a shared helper:

```typescript
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
```

This helper is defined independently in both `index.astro` and `trip/[id].astro`. If you want to change the format, update it in both files.
