# Atelier Forma — Interior Design Studio Template

*Spaces. Crafted With Intent.*

A premium, editorial-style HTML template for interior design and architecture
studios. Built with Bootstrap 5.3, vanilla ES6+ JavaScript, and no build step —
unzip and open in a browser, or upload to any static host.

---

## 1. What's included

```
interior-design-template/
├── index.html               Home 1 — asymmetrical editorial layout
├── home-2.html               Home 2 — immersive pinned-hero layout
├── about.html
├── services.html
├── service-details.html      Luxury Residential Interior Design (sample)
├── projects.html             Filterable project grid
├── project-details.html      The Courtyard Residence (sample case study)
├── journal.html               Blog / insights index (search + pagination)
├── journal-details.html
├── contact.html
├── 404.html
├── coming-soon.html
├── assets/
│   ├── css/
│   │   ├── style.css          Design tokens, layout, components (~1,100 lines)
│   │   ├── dark-mode.css      [data-theme="dark"] overrides
│   │   └── rtl.css            [dir="rtl"] overrides
│   ├── js/
│   │   ├── main.js            UI: nav, theme/RTL, filters, forms, sliders, etc.
│   │   └── parallax.js        Scroll-driven motion (rAF based)
│   └── images/
│       ├── materials/         9 procedural material swatches (.webp)
│       ├── favicon.svg, placeholder.svg, og-cover.jpg
└── documentation/
    └── README.md              You are here
```

Two home page layouts are included, as requested: `index.html` (asymmetrical
grid, classic parallax) and `home-2.html` (a cinematic pinned hero that
expands into an arch as you scroll, horizontal texture slider, scroll-scrubbed
statement text).

---

## 2. Getting started

No build tools, no npm install. Three ways to run it:

1. **Just open it.** Double-click `index.html`. Everything — Bootstrap, Google
   Fonts, Bootstrap Icons — loads from CDN links already in the `<head>`, so
   you need an internet connection but nothing else.
2. **Local server (recommended for development).** From this folder:
   ```
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`.
3. **Static hosting.** Upload the whole folder as-is to Netlify, Vercel,
   GitHub Pages, S3, or any web server. There is nothing to compile.

### CDN dependencies (already linked in every page's `<head>`)
- Bootstrap 5.3.3 (CSS + bundled JS, includes Popper)
- Bootstrap Icons 1.11
- Google Fonts: Cormorant Garamond (display), Manrope (body), Space Grotesk (labels/mono)

If you need to work fully offline, download these four files and swap the
`<link>`/`<script>` URLs in `common.py`'s `head()`/`header()` functions (see
§6) or directly in each HTML file's `<head>` and closing `<body>`.

---

## 3. Editing content

**This template is written as plain HTML** — every page is a finished,
static file. Open any `.html` file in your editor and change text, links, or
image paths directly; no templating engine is required to run the site.

The `build/` Python scripts used to *generate* these HTML files are not
included in this delivery (only the compiled output is). If you're
comfortable with Python and want a single source of truth for shared
content (navigation, footer, project list, etc.) so you don't have to
repeat edits across all 12 pages, you can recreate that layer yourself —
the HTML has clean, consistent class names and structure that make find
-and-replace or a simple templating pass straightforward. Otherwise, treat
each `.html` file as an independent, fully self-contained page.

### Common edits

| What | Where |
|---|---|
| Studio name, tagline, nav links, footer | Repeated in every page's `<header>`/`<footer>` — search and replace across all files |
| Contact details, address, hours | Footer of every page, and `contact.html`'s info column |
| Projects (grid + case study) | `projects.html` cards, and `project-details.html` for the full case study |
| Services list & pricing | `services.html`, `service-details.html` (pricing is clearly marked as demo content — see §5) |
| Journal / blog posts | `journal.html` cards, `journal-details.html` article |
| Colours, fonts, spacing | `assets/css/style.css` §1 "Tokens" at the top of the file |
| Social links, newsletter form action | Footer `<ul class="social">`, `<form data-newsletter>` |

### Images

All photography uses `<img>`/`<picture>`-style responsive markup with
`srcset`, `sizes`, and `loading="lazy"`. Swap the `src`/`srcset` URLs for
your own hosted images — dimensions and aspect ratios are controlled by CSS
(`.frame`, `aspect-ratio`), so images will crop to fit automatically via
`object-fit: cover`. If an image fails to load, the JavaScript automatically
swaps in `assets/images/placeholder.svg`, so a broken link never shows a
broken-image icon.

The 9 material swatches in `assets/images/materials/` (stone, marble, timber,
brass, concrete, glass, linen, terrazzo, tiles) are procedurally generated
textures included as realistic placeholders. Replace with real photography
whenever you have it.

---

## 4. Features reference

- **Two full home page layouts** with distinct hero treatments and content flow.
- **Parallax & scroll motion** (`assets/js/parallax.js`) — depth-layered
  hero imagery, drifting typography, pinned/scrubbed sections, and a
  word-by-word text-lighting effect — all disabled automatically for
  visitors with `prefers-reduced-motion: reduce`.
- **Dark mode** — toggle in the header; persists via `localStorage`
  (`af-theme`) and otherwise follows the OS `prefers-color-scheme`.
- **RTL layout** — toggle in the header; swaps in `rtl.css`, loads Arabic/
  Hebrew web fonts on demand, and mirrors icons, transforms and gradients.
  Persists via `localStorage` (`af-dir`).
- **Filterable project grid** (`projects.html`) with URL-synced category
  filters (`?cat=residential`, etc.).
- **Journal search + category filter + pagination**, all client-side.
- **Multi-step-feeling contact form** with real-time validation, accessible
  error messaging, and a success state. Wire up your own backend by setting
  `data-endpoint="/your-form-handler"` on `#enquiry-form` (see §5).
- **Image lightbox / gallery** with keyboard arrow navigation.
- **Before/after comparison slider** on the project case study page.
- **Horizontal drag-to-scroll sliders** for materials and featured projects.
- **Countdown timer** on `coming-soon.html` (edit the target ISO date in
  that file's `data-countdown` attribute).
- **Full keyboard accessibility**: skip link, visible focus states, ARIA
  labelling on toggles/menus/dialogs, and semantic landmarks throughout.
- **SEO**: unique title/meta description per page, canonical tags, Open
  Graph + Twitter Card tags, and JSON-LD structured data
  (Organization + LocalBusiness, and per-page Article/Service/etc. where relevant).

---

## 5. Before you launch — demo content to replace

- **Pricing** (`service-details.html`): the ₹1,50,000 / ₹3,50,000 / ₹7,50,000
  package tiers are placeholder figures, clearly marked "DEMO PRICING" in
  the page itself. Replace with your real rates.
- **Contact form submission**: the form currently validates client-side and
  shows a success message, but does not send data anywhere. Add your
  endpoint via the form's `data-endpoint` attribute (Formspree, Netlify
  Forms, your own API, etc.) in `contact.html`.
- **Newsletter forms**: same as above — currently a client-side-only
  success/error message. Connect to your email provider's API or embed form.
- **Map**: `contact.html` uses a stylised illustrated placeholder, not a
  live map. Swap the `.map-ph` block for a Google Maps / Mapbox embed if
  you want an interactive map.
- **Placeholder studio details**: address, phone, email, opening hours,
  team names/bios, testimonials, and all project/journal copy are sample
  content — replace throughout.
- **Countdown date** on `coming-soon.html` — currently set to a placeholder
  future date.

---

## 6. Browser support & performance notes

- Built and tested against evergreen Chromium, Firefox, and Safari.
- `prefers-reduced-motion` disables all scroll-driven animation instantly.
- Images use `loading="lazy"` (except above-the-fold hero images, which are
  `eager` with `fetchpriority="high"` for LCP) and responsive `srcset`.
- No client-side router, no bundler, no JS framework — every page is
  independently loadable and cacheable.
- CSS uses logical properties (`inset-inline-*`, `margin-inline-*`, etc.)
  throughout, which is what makes the RTL stylesheet as small as it is.

---

## 7. Support

This is a static template with no ongoing license-based support channel.
Everything you need to customise it — tokens, components, and behaviour —
lives in the three CSS files and two JS files under `assets/`. Read the
comments at the top of each file for a quick map of its contents.
