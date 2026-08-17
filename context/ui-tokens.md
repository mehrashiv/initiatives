# UI Tokens

Design tokens for Initiative Tracker, carried over exactly from Nile's brand design system (`colors_and_type.css`, per the official *Nile Brand Visual Identity Guidelines v1.0*) — this is Nile's own internal tool, so the Nile logo, palette, and type are the real, correct brand, not a placeholder. Every hex/value below is identical to the source file; only the CSS variable *names* are changed, to semantic Tailwind v4 token names per this project's own convention. Each token's comment names the official Nile color it maps back to, so the link to the brand guideline isn't lost. Never hardcode a hex value or use a raw Tailwind color class in a component — always use these tokens.

---

## How to Use

This project uses **Tailwind CSS v4**. All tokens are defined with the `@theme` directive in `app/globals.css`. No `tailwind.config.ts` needed for colors or tokens.

```tsx
// Correct
className="bg-surface text-text-primary border-border"

// Also correct
style={{ color: "var(--color-accent)" }}

// Never — hardcoded hex
className="bg-[#0E4EAF] text-[#001E2D]"

// Never — raw Tailwind color classes
className="bg-blue-600 text-slate-700"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

/* Inter — self-hosted, reuse /fonts/inter-*.woff2 from the design system */
@font-face { font-family:'Inter'; font-style:normal; font-weight:400; font-display:swap; src:url('/fonts/inter-400.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-style:normal; font-weight:500; font-display:swap; src:url('/fonts/inter-500.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-style:normal; font-weight:600; font-display:swap; src:url('/fonts/inter-600.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-style:normal; font-weight:700; font-display:swap; src:url('/fonts/inter-700.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-style:italic; font-weight:400; font-display:swap; src:url('/fonts/inter-400-italic.woff2') format('woff2'); }

@theme {
  /* Font */
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Arial, sans-serif;

  /* Accent — Nile Blue family (primary brand color) */
  --color-accent: #0E4EAF;          /* Nile Blue */
  --color-accent-hover: #0A3C87;    /* Nile Blue 700 */
  --color-accent-deep: #072F68;     /* Deep Nile Blue */
  --color-accent-bright: #2070E1;   /* Bright Nile Blue — links, focus ring base */
  --color-accent-light: #DCE8FB;    /* Nile Blue 100 */
  --color-accent-lightest: #EEF4FE; /* Nile Blue 050 */

  /* Success — Nile Teal */
  --color-success: #35D39A;         /* Nile Teal */
  --color-success-dark: #1E8C66;    /* Teal 700 */
  --color-success-light: #D6F5E9;   /* Teal 100 */

  /* Warning — Solar Amber */
  --color-warning: #FF6600;         /* Solar Amber */
  --color-warning-light: #FFE7D4;   /* Amber 100 */

  /* Danger — Solar Crimson (two shades: logo vs. CTA/brand-gradient) */
  --color-danger: #EE4A59;          /* Solar Crimson (logo) */
  --color-danger-cta: #EC394C;      /* Solar Crimson — CTA + brand gradient */
  --color-danger-light: #FCE0E3;    /* Crimson 100 */

  /* Extra category accents */
  --color-violet: #8758ED;          /* Dawn Violet */
  --color-violet-light: #ECE3FC;    /* Violet 100 */
  --color-sky: #8BB4EE;             /* Nile Sky */
  --color-sky-light: #CBDEFA;       /* Nile Sky 100 */

  /* Neutrals */
  --color-text-primary: #001E2D;    /* Nile Ink */
  --color-text-secondary: #4D626C;  /* Nile Slate */
  --color-text-faint: #6B8295;
  --color-background: #FFFFFF;      /* White */
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F6F8FB;  /* Cloud Mist */
  --color-surface-inset: #EEF2F8;

  /* Borders */
  --color-border: #DCE3ED;
  --color-border-strong: #C2CEDD;

  /* Type scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-md: 1.25rem;    /* 20px */
  --text-lg: 1.5rem;     /* 24px */
  --text-xl: 1.75rem;    /* 28px */
  --text-2xl: 2.25rem;   /* 36px */
  --text-3xl: 3rem;      /* 48px */
  --text-4xl: 3.5rem;    /* 56px */
  --text-5xl: 4.5rem;    /* 72px */

  --font-weight-reg: 400;
  --font-weight-med: 500;
  --font-weight-semi: 600;
  --font-weight-bold: 700;

  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-body: 1.55;
  --tracking-tight: -0.02em;
  --tracking-wide: 0.08em;

  /* Radii */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-pill: 999px;

  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 24px;
  --spacing-6: 32px;
  --spacing-7: 48px;
  --spacing-8: 64px;
  --spacing-9: 96px;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0,30,45,.06);
  --shadow-sm: 0 2px 6px rgba(0,30,45,.07), 0 1px 2px rgba(0,30,45,.05);
  --shadow-md: 0 8px 24px rgba(0,30,45,.09), 0 2px 6px rgba(0,30,45,.05);
  --shadow-lg: 0 20px 48px rgba(0,30,45,.14), 0 6px 14px rgba(0,30,45,.07);
  --shadow-accent-glow: 0 14px 34px rgba(14,78,175,.28);
  --shadow-cta-glow: 0 12px 30px rgba(236,57,76,.30);
  --ring-focus: 0 0 0 3px rgba(32,112,225,.35);

  /* Motion */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 360ms;
  --ease-standard: cubic-bezier(.2,.7,.3,1);
}
```

```css
/* Gradients — not expressible as @theme color tokens, defined as plain CSS custom properties */
:root {
  --gradient-logo-mark: radial-gradient(circle at 30% 15%, #FF6600 30%, #EE4A59 75%);
  --gradient-logo-mark-linear: linear-gradient(135deg, #FF6600 0%, #EE4A59 100%);
  --gradient-cta: linear-gradient(135deg, #EC394C 0%, #FF6600 100%); /* CTA buttons MUST use this — never a solid color */
  --gradient-brand: linear-gradient(120deg, #0E4EAF 0%, #EC394C 60%, #FF6600 100%); /* dividers/strips — sparingly */
}
```

---

## Color Usage Guide

### Page Layout
| Element | Token |
|---|---|
| Page background | `bg-background` |
| Card / surface | `bg-surface` |
| Subtle surface (e.g. page chrome behind cards) | `bg-surface-subtle` |
| Default border | `border-border` |
| Strong border (dividers, emphasis) | `border-border-strong` |

### Typography
| Element | Token |
|---|---|
| Primary text, headings | `text-text-primary` (#001E2D) |
| Secondary / muted text | `text-text-secondary` (#4D626C) |
| Faint captions | `text-text-faint` (#6B8295) |

### Accent (Nile Blue)
Used for: primary buttons (non-CTA), active nav item, links, focus rings, accent badges.
| Element | Token |
|---|---|
| Primary button background | `bg-accent` |
| Primary button hover | `bg-accent-hover` |
| Active nav text | `text-accent` |
| Light accent badge background | `bg-accent-light` |

### CTA buttons
CTA buttons (e.g. "+ New initiative", "+ New task", "+ New project") **must** use `var(--gradient-cta)` as their background — never a solid color — per the brand guideline. Text is Inter Bold, white.

## Status Badges (Tasks)

| Status | Background | Text |
|---|---|---|
| To Do | `bg-surface-subtle` | `text-text-secondary` |
| In Progress | `bg-accent-light` | `text-accent` |
| Blocked | `bg-danger-light` | `text-danger-cta` |
| Delayed | `bg-warning-light` | `text-warning` |
| Done | `bg-success-light` | `text-success-dark` |

## Status Badges (Initiatives / Projects)

| Status | Background | Text |
|---|---|---|
| Active | `bg-success-light` | `text-success-dark` |
| Inactive | `bg-surface-subtle` | `text-text-secondary` |

---

## Typography

| Element | Size | Weight | Line height | Color token |
|---|---|---|---|---|
| Page heading (h1) | 36px (`text-2xl`) | 600 | snug | `text-text-primary` |
| Section heading (h2) | 28px (`text-xl`) | 600 | snug | `text-text-primary` |
| Card title (h3) | 24px (`text-lg`) | 600 | snug | `text-text-primary` |
| Body / primary content | 16px (`text-base`) | 400–500 | body | `text-text-primary` |
| Secondary / label | 14px (`text-sm`) | 500 | body | `text-text-secondary` |
| Caption / timestamp | 12px (`text-xs`) | 400 | 16px | `text-text-faint` |
| KPI stat number | 36px (`text-2xl`) | 600 | tight | `text-text-primary` |
| Eyebrow / overline | 14px (`text-sm`) | 700, uppercase, wide tracking | — | `text-accent` (corrected Feature 26 — first real usage, Dashboard's "Portfolio" eyebrow, is unambiguously blue in the mockup; this row previously said `text-warning` but had never been built against) |

Font family: **Inter**, self-hosted (no Google Fonts CDN — reuse the `/fonts/inter-*.woff2` files from the design system).

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| `spacing-1` | 4px | Tight inline gaps |
| `spacing-2` | 8px | Badge/tag gaps |
| `spacing-3` | 12px | Form field gaps |
| `spacing-4` | 16px | Section internal gaps |
| `spacing-5` | 24px | Card padding, between-card gaps |
| `spacing-6` | 32px | Page section gaps |
| `spacing-7` | 48px | Large section breaks |

---

## Component Tokens

### Cards
```
background: bg-surface
border: 1px solid var(--color-border)
border-radius: var(--radius-lg)   /* 16px */
padding: var(--spacing-5)          /* 24px */
box-shadow: var(--shadow-sm)
```

### Buttons

**Primary (non-CTA actions, e.g. "Save"):**
```
background: var(--color-accent)
color: white
border-radius: var(--radius-sm)    /* 8px */
padding: 8px 16px
font-weight: var(--font-weight-med)
```

**CTA (e.g. "+ New initiative"):**
```
background: var(--gradient-cta)
color: white
border-radius: var(--radius-pill)
padding: 8px 20px
font-weight: var(--font-weight-bold)
box-shadow: var(--shadow-cta-glow)
```

**Secondary:**
```
background: var(--color-surface)
border: 1px solid var(--color-border)
color: var(--color-text-primary)
border-radius: var(--radius-sm)
padding: 8px 16px
```

**Ghost:**
```
background: transparent
color: var(--color-text-secondary)
hover: background var(--color-surface-subtle)
```

### Input Fields
```
background: var(--color-surface)
border: 1px solid var(--color-border)
border-radius: var(--radius-sm)
padding: 8px 12px
focus: box-shadow var(--ring-focus); border-color var(--color-accent-bright)
```

### Badges
```
border-radius: var(--radius-pill)
padding: 2px 8px
font-size: var(--text-xs)
font-weight: var(--font-weight-med)
```

### Drawer (Initiative / Project create-edit)
```
width: 468px
background: var(--color-surface)
box-shadow: var(--shadow-lg)
slide-in from right, var(--duration-base) var(--ease-standard)
```

### Kanban Card
```
background: var(--color-surface)
border-left: 4px solid <status color from Status Badges table>
border-radius: var(--radius-md)
box-shadow: var(--shadow-xs); lift to var(--shadow-sm) on drag
```

### Gantt Bar
```
fill: <schedule-health color, not the raw task status — see below>
overrun stripe: repeating diagonal hatch, var(--color-warning) at 40% opacity
early-delivery outline: dashed, 1.5px, var(--color-success-dark)
delivery-date marker: diamond, 8px, var(--color-text-primary)
today line: 1px solid var(--color-accent-bright), full chart height
```

**Gantt bar colors are a separate 5-bucket "schedule health" mapping, not the Status Badges (Tasks) table above** — resolved during Feature 15's `/architect` session, deliberately overriding the literal design mock's colors (which used orange for "Overdue" and pink/crimson for "Delayed Nd") to stay consistent with this project's standing rule that Delayed must read distinctly from Blocked:

| Bucket | When | Color |
|---|---|---|
| On time | Delivered on/before `end_date`, or `done` with no delivery date | `var(--color-success-dark)` |
| In progress | `status = in_progress`, not past `end_date` | `var(--color-accent)` |
| To do | `status = to_do`, not past `end_date` | `var(--color-text-secondary)` |
| At risk | `status = blocked` (any time), OR not done/undelivered and past `end_date` ("Overdue") | `var(--color-danger-cta)` |
| Delayed | Delivered later than `end_date`, by N days | solid portion (start→`end_date`) is the **On time** green; only the hatch tail (`end_date`→`delivery_date`) is `var(--color-warning)` |

A bar's solid (on-track) segment is always green up to wherever the tail begins — the bucket's own accent color only applies to its label/dot and (for In progress/To do/At risk, which have no tail) the whole bar.

### Logo
```
mark: Nile shield, gradient var(--gradient-logo-mark-linear), 28x28px
wordmark: "nile", Inter Semibold, var(--color-accent-deep), 19px
```

### Dashboard Chart Colors
| Chart | Color |
|---|---|
| Portfolio completion trend (line) | `var(--color-accent)` stroke, gradient fill `rgba(14,78,175,0.15)` |
| Owner workload (bars) | `var(--color-accent-bright)` |
| Status breakdown (donut) | one slice per status, using the Status Badges colors above |
| At-risk / overdue indicators | `var(--color-danger-cta)` |
| Chart grid lines | `1px dashed var(--color-border)` |
| Chart axis labels | `var(--color-text-faint)`, 12px |

---

## Invariants

- Never use a hex value directly in a component — always go through a CSS variable/Tailwind token.
- Font is Inter, self-hosted — never fall back to a system font as primary.
- CTA buttons always use `var(--gradient-cta)` — never a solid color, per the brand guideline.
- Status badge colors (Tasks and Initiatives/Projects) always come from the tables above — never hardcoded per-component.
- Never use Tailwind's built-in color classes (`bg-blue-500`, `text-gray-600`) — project tokens only.
- All borders default to `var(--color-border)` unless explicitly calling for `--color-border-strong`.
