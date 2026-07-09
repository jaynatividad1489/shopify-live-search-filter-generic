# 🔍 Shopify Live Search & Filter — Generic Edition

> A fully-featured, production-ready Live Search & Collection Filter that works on **ANY Shopify theme** — zero Dawn dependencies, fully self-contained styles and logic.

![Shopify](https://img.shields.io/badge/Shopify-Any_Theme-96BF48?style=flat-square&logo=shopify&logoColor=white)
![Liquid](https://img.shields.io/badge/Liquid-Templating-0090D6?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Accessible](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🎯 Why This Exists

Shopify's default search is basic and collection filtering requires an expensive app. This Generic edition gives merchants a **full-featured search and filter experience** that drops into any Shopify theme — no Dawn required, no apps, no monthly fees.

---

## ✨ Features

### 🔎 Live Predictive Search
- Instant results using Shopify's **Predictive Search API**
- Debounced input (300ms) — no unnecessary API calls
- Product image, title, vendor, and price in dropdown
- Keyboard navigation ↑ ↓ Enter Escape
- Recent searches saved to localStorage (with remove)
- Loading spinner during fetch
- Empty + error states
- Screen reader live announcements

### 🗂️ Collection Filtering
- AJAX filtering — **no page reload**
- Multi-select checkbox facets
- Color swatch support
- Dual-handle price range slider + manual number inputs
- Sort by dropdown
- Active filter tags with individual remove
- Clear all filters
- URL sync via `pushState` — browser back/forward works
- Live product count updates
- Loading state on grid
- Empty results state
- AJAX pagination

### 📱 Mobile
- Slide-in filter drawer (from left)
- Filter count badge on toggle
- Focus trap inside drawer
- Swipe-friendly
- Responsive grid (2 col mobile → up to 4 col desktop)

### ♿ Accessibility
- Full ARIA roles and states
- Keyboard navigation throughout
- Focus trap in filter drawer
- `aria-live` result announcements
- `prefers-reduced-motion` support
- `noscript` fallback for filter form

---

## 📁 File Structure

```
generic/
│
├── sections/
│   └── search-filter-generic.liquid          ← Main section
│
├── snippets/
│   └── search-filter-generic-facets.liquid   ← Facets (checkboxes, price range)
│
└── assets/
    ├── search-filter-generic.js              ← All logic (5 modules)
    └── search-filter-generic.css             ← Self-contained styles
```

---

## 🆚 Generic vs Dawn Edition

| Feature | Generic | Dawn |
|---|---|---|
| Works on any theme | ✅ | ❌ Dawn only |
| Zero theme dependencies | ✅ | ❌ |
| CSS design tokens (customize easily) | ✅ | ❌ |
| Uses Dawn CSS custom properties | ❌ | ✅ |
| Uses Dawn Web Component pattern | ❌ | ✅ |
| Uses Dawn button/card/price classes | ❌ | ✅ |
| Color scheme picker (Theme Editor) | ❌ | ✅ |
| Matches Dawn's exact visual style | ❌ | ✅ |

> **Which should I use?**
> - Running Dawn? → Use the **Dawn Edition**
> - Running any other theme (Debut, Impulse, custom, etc.)? → Use the **Generic Edition**

---

## 🚀 Installation

### Step 1 — Upload files

In **Online Store → Themes → Edit Code:**

```
sections/ → search-filter-generic.liquid
snippets/ → search-filter-generic-facets.liquid
assets/   → search-filter-generic.js
assets/   → search-filter-generic.css
```

### Step 2 — Enable Shopify Search & Discovery filters

1. Go to **Apps → Search & Discovery**
2. Under **Filters**, enable filters (Size, Color, Price, etc.)
3. Assign filters to your collections

### Step 3 — Add section to a collection template

In Theme Editor:
1. Go to a **Collection** page
2. Click **Add section** → Select **Search & Filter (Generic)**
3. Configure settings

### Step 4 — Customize design tokens

Open `search-filter-generic.css` and update the CSS variables at the top to match your theme:

```css
:root {
  --sfg-bg:          #ffffff;   /* Drawer + results background */
  --sfg-text:        #1a1a1a;   /* Primary text color */
  --sfg-text-muted:  #6b7280;   /* Secondary text, counts */
  --sfg-border:      #e5e7eb;   /* Borders, dividers */
  --sfg-accent:      #1a1a1a;   /* Buttons, active states, slider fill */
  --sfg-accent-text: #ffffff;   /* Text on accent-colored buttons */
  --sfg-sale:        #dc2626;   /* Sale badge + price color */
  --sfg-radius:      0.6rem;    /* Border radius everywhere */
  --sfg-font:        inherit;   /* Font family (inherits from theme) */
  --sfg-sidebar-w:   26rem;     /* Sidebar width on desktop */
}
```

---

## ⚙️ Theme Editor Settings

| Setting | Description |
|---|---|
| Show Search Bar | Toggle predictive search on/off |
| Search Placeholder | Custom input placeholder text |
| Max Search Results | Products shown in dropdown (3–10) |
| Products Per Page | Grid size (8–48) |
| Columns Desktop | 2, 3, or 4 column grid |
| Filter Position | Sidebar / Top (horizontal) / Drawer |
| Show Sort Dropdown | Toggle sort control |
| Show Product Vendor | Show/hide vendor name on cards |

---

## 🔌 JavaScript API

All modules are accessible via `window.SFG`:

```javascript
// Manually trigger a filter load
window.SFG.Filters.load('/collections/all?filter.p.m.color=red');

// Open / close the mobile filter drawer
window.SFG.Drawer.open();
window.SFG.Drawer.close();

// Trigger a search
window.SFG.Search.fetch('running shoes');

// Listen for filter updates
window.addEventListener('popstate', (e) => {
  console.log('Filter URL changed:', e.state?.sfgUrl);
});
```

---

## 🧪 Edge Cases Handled

| Scenario | Behavior |
|---|---|
| Search query < 2 chars | Results panel closes, no API call |
| Network error on search | Error message shown in dropdown |
| No search results | "No results" state with tip |
| Filter returns 0 products | Empty state with clear filters CTA |
| Filter fetch network error | Console warning, UI stays usable |
| Browser back button | Restores previous filter state via `popstate` |
| Price min > max | Min slider clamped to max - 1 |
| Price max < min | Max slider clamped to min + 1 |
| No JS (noscript) | Standard form submit button shown |
| More than 8 facet values | "Show more" button reveals the rest |
| Mobile drawer open | Body scroll locked, focus trapped |
| Drawer escape key | Drawer closes, focus returns to toggle |
| Filter tags removed | Drawer count badge updates instantly |
| Recent search removed | Removed from localStorage immediately |

---

## 📋 Roadmap

- [ ] Trending search suggestions
- [ ] In Stock availability toggle filter
- [ ] Infinite scroll (replace pagination)
- [ ] Tag-based filtering support
- [ ] Save filter presets
- [ ] Search analytics hook

---

## 👤 Author

**John Venedick Natividad**
Senior Shopify Developer & CRM Implementation Specialist
14+ years building eCommerce experiences for global brands

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/jaynatividad)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github)](https://github.com/jaynatividad1489)
[![Email](https://img.shields.io/badge/Email-Contact-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:jaynatividad1489@gmail.com)

---

## 📄 License

MIT — free to use in personal and commercial Shopify projects.
If this helped you, a ⭐ star on the repo is always appreciated!
