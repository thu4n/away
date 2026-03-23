# Styling & Theming Guide

## How Styling Works

Away uses **Tailwind CSS v4** loaded via the Vite plugin. All Tailwind utility classes are available in `.astro` files directly.

Global styles, custom variables, and `@theme` definitions live in:

```
src/styles/global.css
```

This file is imported by `Layout.astro` and applies to every page globally.

---

## Color Scheme

The app uses a bespoke **Sapphire Nightfall Whisper** palette implemented via CSS variables mapped to Tailwind `@theme`.

### Base Color Tokens (global.css)

```css
@theme {
  --color-whisper: var(--whisper);
  --color-sky-mist: var(--sky-mist);
  --color-sapphire: var(--sapphire);
  --color-nightfall: var(--nightfall);
  --color-pale-sapphire: var(--pale-sapphire);
  --color-ocean: var(--ocean);
  --color-white: #ffffff;
}

:root {
  /* LIGHT MODE (Default) */
  --whisper: #ebf4fa;         /* Lightest airy blue bg */
  --pale-sapphire: #f5f9fd;   /* Clean white-blue card surface */
  --sky-mist: #7ec8e3;        /* Soft sky blue accent */
  --sapphire: #1d5fa8;        /* Core Sapphire blue (Primary) */
  --nightfall: #0b1d39;       /* Deep navy text */
  --ocean: #2a7ab5;           /* Hover blue */
  
  --bg-color: var(--whisper);
  --card-bg: var(--pale-sapphire);
  --text-color: var(--nightfall);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* DARK MODE */
    --whisper: #e6eef7;       /* Light text on dark bg */
    --pale-sapphire: #112244; /* Deep navy card surface */
    --sky-mist: #7ec8e3;      /* Airy blue */
    --sapphire: #4f91d4;      /* Brighter Sapphire for dark mode primary */
    --nightfall: #0b1d39;     /* Deepest midnight navy page bg */
    --ocean: #2a7ab5;         /* Mid-ocean hover state */

    --bg-color: #0b1d39;
    --card-bg: #112244;
    --text-color: #e6eef7;
  }
}
```

### Changing the Color Scheme

To overhaul the theme palette, edit the base CSS variables in `:root` and the dark mode `@media` block in `src/styles/global.css`.

- `bg-sapphire` acts as your primary action color (buttons, pill filters).
- `bg-ocean` is the standard hover color for intense elements.
- `bg-pale-sapphire` and `dark:bg-nightfall/60` are used primarily as card backings.
- Warning or destructive elements still use tailwind's native `red-600` and `amber-500` primitives.

> **Important:** Form inputs internally override `color: var(--text-color) !important;` during dark mode so white text remains visible inside `.bg-white` input shells that have been dimmed down.

---

## Dark Mode

Dark mode is **automatic** — it strictly follows the user's system preference via `prefers-color-scheme: dark`. There is no manual toggle.

The entire UI is decorated with `dark:` variants alongside standard classes (e.g. `border-gray-200 dark:border-slate-600`).

---

## Typography

The app uses **Inter** from Google Fonts, loaded in `Layout.astro`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
```

---

## Special Custom CSS Classes

| Class           | Defined In     | Purpose                                         |
| --------------- | -------------- | ----------------------------------------------- |
| `.glassmorphism` | `global.css`  | Frosted glass effect for the sticky headers      |
| `.scrollbar-none`| `global.css`  | Hides scrollbar on horizontal pill tab areas     |
| `dialog`         | `global.css`  | Bottom-sheet default positioning + sliding hook  |

---

## Currency Formatting

Expenses are formatted using the native `Intl.NumberFormat` API directly in the Astro frontmatter:

```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
```

To swap to USD or EUR:
1. Update `trip/[id].astro` → `formatCurrency` locale string.
2. Update the floating Dong symbol `₫` inside the Expense creation form prefix to `$`.
3. Adjust the `step="1000"` on the `<input type="number">` since USD increments functionally at `1` scale, not thousands.

---

## Date Formatting

All dates are rendered natively bypassing `new Date()` quirks by manually dissecting UTC boundary strings. 
```typescript
const formatDate = (date: string | Date) => { ... }
```
You can modify this helper locally within `index.astro` and `trip/[id].astro` to manipulate your preferred `DD/MMM/YYYY` structure.
