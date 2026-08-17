# Nile Design System

A working design system for **Nile** — the Secure Network-as-a-Service (NaaS) company. It captures Nile's *Brand Colours 2026* palette, typography, logo system, visual motifs, voice, iconography, plus reusable UI-kit components and presentation slide templates, so design agents can generate on-brand interfaces, decks, and assets.

> **Reader note:** Tokens, type, and color in this system follow the **official _Nile Brand Visual Identity Guidelines v1.0_ (Feb 2026)** — the authoritative source — supplemented by the *Nile Brand Colours 2026* PPTX template and public material on **nilesecure.com**. The marketing UI kit + slide templates are brand-accurate; the Portal UI kit recreates surfaces Nile publicly describes (not production code). For brand questions/exceptions the guidelines direct teams to **brand@nilesecure.com**.

---

## 1 · Company & product context

**Nile** (nilesecure.com, HQ San Jose CA, founded 2018 by ex-Cisco execs John Chambers & Pankaj Patel) delivers the **enterprise network — wired & wireless LAN — entirely as a service**. No boxes to buy, no appliances to manage: hardware, software, and operations are bundled into a subscription with guaranteed performance SLAs and **Zero Trust security built in**.

Positioning line from the template: **"The World's Most Secure Network. Delivered As-A-Service."**

Core pillars Nile talks about:
- **Zero Trust Fabric** — switches, access points, gateways & sensors that are secure by design, with identity-based micro-segmentation.
- **Autonomous Operations** — AI (Nile AI) with deep telemetry detects, predicts, and remediates issues via closed-loop automation.
- **Cloud-delivered services** — consumed as a subscription; OpEx not CapEx; ~60% lower TCO claim.

### Products / surfaces represented here
| Surface | What it is | UI kit |
|---|---|---|
| **Marketing site** (nilesecure.com) | Brand/marketing web presence — NaaS value prop, customer proof, Gartner recognition | `ui_kits/marketing/` |
| **Nile Portal** | The operator app: define policy, end-to-end network visibility, sites/buildings, device inventory (switches/APs/gateways/sensors), alerts, segmentation | `ui_kits/portal/` |
| Other named apps (documented, not built) | *Nile Nav* (AI site-survey app), *Nile Digital Twin*, *AI-Ops Command Center*, *Nile Guest* | — |

### Sources
- `uploads/NilePPTTemplate.pptx` — primary artifact (theme, palette, fonts, logo PNG/SVG, brand graphics, device mockups).
- https://nilesecure.com — product framing, voice, customer quotes, positioning.
- Corroborating: Wikipedia "Nile (company)", LinkedIn /company/nilesecure, BusinessWire (RSAC 2026 brand-identity launch).

---

## 2 · Content fundamentals (voice & tone)

Nile's voice is **confident, plain-spoken, and outcome-obsessed** — a challenger brand taking on 30+ years of legacy networking. It sounds like a senior engineer who's also a sharp marketer: technical credibility without jargon soup.

- **Person:** Speaks as **"we" / "Nile"**, addresses the reader as **"you" / "your IT team."** Customer voices ("they") carry the proof.
- **Casing:** Sentence case for body and most headlines. **Title Case** for the signature tagline ("Delivered As-A-Service"). Product names are capitalized: *Nile Access Service, Nile Portal, Zero Trust Fabric, Nile AI*. Acronyms: **NaaS, LAN, SLA, TCO, ZTN, SASE** (all-caps, no periods).
- **Sentence shape:** Short, declarative, benefit-first. Strings of three are common ("simple, secure, guaranteed"; "security, simplicity, speed and savings").
- **Numbers as proof:** Specific, recurring metrics — **60+ patents, 60% lower TCO, 25–30% cost savings, 100+ users, 0 complaints, 24×7 support.** Use real-feeling numbers, never vague ones.
- **Vibe:** "We don't think, we know." Bold, a little disruptive, never gimmicky. Avoids fear-mongering even though it's security — leads with *outcomes and relief* ("the network runs itself"), not threats.
- **Emoji:** Used **only on social** (LinkedIn) — 🐊 (the Nile crocodile mascot for #NileInTheWild), ⚡️💪. **Never in product UI, decks, or the website body.** Do not use emoji in generated artifacts unless explicitly social.

**Example copy that sounds like Nile:**
> "No boxes to buy. No appliances to manage. All hardware is included in Nile's service."
> "The future of networking isn't owning the hardware. It's about owning the outcome."
> "Move beyond 30 years of operational burden and reduce your TCO by more than 60%."

---

## 3 · Visual foundations

The Nile 2026 look is **bright, clean, and optimistic** — lots of white space, a confident blue, and one hot orange-to-coral accent that does almost all the emotional work. It reads enterprise-credible but distinctly more energetic and modern than legacy networking brands.

### Color (official palette)
- **Primary (dominant everywhere):** **Nile Blue `#0E4EAF`** is the foundation, extended by **Deep Nile Blue `#072F68`** and **Bright Nile Blue `#2070E1`**.
- **Neutrals:** **Nile Ink `#001E2D`** (primary body text), **Nile Slate `#4D626C`** (muted text), **White `#FFFFFF`**, **Cloud Mist `#F6F8FB`** (light content surfaces).
- **Secondary (emphasis only — ≤10–20% of any composition, never overpowering the blues):** **Solar Amber `#FF6600`**, **Nile Teal `#35D39A`**, **Dawn Violet `#8758ED`**, **Nile Sky `#8BB4EE`**.
- **Gradients (use sparingly):**
  - *CTA buttons* — **MUST** use the **Solar Crimson → Solar Amber** gradient (`#EC394C → #FF6600`); solid accent colors are **not** allowed for CTAs. CTA text is Inter Bold in white or Solar Amber.
  - *Brand gradient* — Nile Blue + Solar Crimson + Solar Amber (`#0E4EAF · #EC394C · #FF6600`) for tickers, section dividers, highlight strips, select moments.
  - *Logo shield* — Solar Amber → Solar Crimson (`#FF6600 → #EE4A59`). (Note the logo's Solar Crimson `#EE4A59` differs from the CTA/brand crimson `#EC394C`.)
- **Vibe of imagery:** cool, clean, **digital-blue** — flowing ribbon/wave forms, dotted "particle-swarm" trails, soft sky halos. See Photography below for the people-imagery treatment.

### Type (official — Inter)
**Inter is the one and only brand typeface** for all digital & print communications — *do not substitute or mix additional typefaces*. **Inter Semibold (600)** for headlines & subheadings (e.g. 56pt headline / 36pt subhead, Nile Ink), **Inter Regular (400)** for body & long-form (20pt), **Inter Bold (700)** reserved for CTA text. **Arial (Regular & Bold)** is used **only** in editable docs (PowerPoint, Word) for cross-platform compatibility when Inter is unavailable. Pull-quotes use Inter italic — not a separate face.

### Backgrounds & motifs
- **Mostly white / cloud**, generous margins. Not full-bleed-photo heavy.
- **Flowing blue waves & ribbons** (3D-rendered, electric blue) anchored to a corner or edge — never centered behind text.
- **Dotted particle-swarm trails** (blue halftone dots fanning out of a wave) as a recurring texture.
- **Soft sky-blue radial halos/glows** (`#CBDEFA` → transparent) for gentle depth behind cards or orbs.
- **The orb:** an orange→coral gradient sphere carrying the logo — a hero device on title/cover surfaces.
- **Photography:** real people in authentic business/technology/modern-work settings — confident, calm, intelligent; never staged or over-polished. Apply a consistent treatment: **desaturate ~30%** and optionally a **cool-tone overlay**; brand textures/patterns may sit as subtle low-opacity overlays in approved colors. Reflect diversity across people, roles, environments.
- No repeating geometric patterns, no noise/grain, no busy textures.

### Surfaces, depth & motion
- **Cards:** white, generous radius (`12–24px`), hairline border (`#DCE3ED`) **and** a soft low shadow — *not* border-only. Lift slightly on hover.
- **Corner radii:** soft and modern — `8–16px` for controls/cards, `24–32px` for large feature panels, full pills for tags/CTAs.
- **Shadows:** soft, blue-tinted, diffuse (shadows derive from navy `rgba(0,30,45,…)`), never hard black. Colored glow shadows for primary/orange CTAs.
- **Borders:** hairline cool-grey on light; low-opacity white on dark.
- **Transparency & blur:** light frosted/translucent panels over the orb or waves; otherwise solid.
- **Animation:** smooth and restrained — fades, gentle rises (8–16px), eased `cubic-bezier(.2,.7,.3,1)` ~200ms. No bounce, no spin, no infinite decorative loops in product UI.
- **Hover:** darken primary blue, or shift to orange for links; subtle lift + shadow on cards.
- **Press:** slight scale-down (`.97–.98`) and/or deeper color.
- **Focus:** 3px bright-blue ring at 35% opacity.
- **Gradients vs capsules:** text over imagery sits in solid/frosted capsules or clear white space — never raw on a busy wave. Reserve gradients for the brand mark, hero orbs, and dark-section backgrounds.

---

## 4 · Iconography

Per the official guidelines, icons are a **supporting element used sparingly** — never a replacement for text or bullets, and only where they add clarity. If no suitable icon exists, use text instead.

- **Style: lineart only.** Filled, solid, or mixed-style icons are **not permitted**. Do not alter stroke weight, corner radius, or proportions. Each icon must represent only its assigned meaning (don't repurpose). Add a text label where clarity is needed.
- **Color:** on white/light backgrounds use **Nile Ink `#001E2D`** or **Nile Blue `#0E4EAF`**; on dark backgrounds, brand colors, or gradients use **white only**. Always prioritize contrast.
- **No bundled icon font shipped.** **Substitution (FLAGGED):** for UI work use **Lucide** (https://lucide.dev) — strictly its outline (lineart) set, consistent stroke — which matches the guideline's lineart-only rule. `ui_kits/_shared/icons.jsx` ships a curated Lucide `NileIcon` set (shield, router, server, wifi, gateway/globe, activity, lock, etc.). Swap for Nile's official set if one is provided.
- **The shield** (`assets/nile-shield.png` / `nile-shield-white.png`) is the brand's security glyph — and a secondary brand identifier (favicon / brand-led use only, never replacing the full logo where space permits). Reuse it rather than drawing a new shield.
- **Brand mark** (`assets/brand-mark.svg`) is the orange-coral decorative device for accents.
- **Emoji / unicode as icons:** avoid in product UI, web, and decks. The 🐊 crocodile is social-only.
- **Never hand-draw bespoke SVG icons** to fake Nile's look — use the copied brand assets or the Lucide outline set.

---

## 5 · Index / manifest

Root files:
- **`README.md`** — this document.
- **`colors_and_type.css`** — all design tokens (color, type, spacing, radius, shadow, motion) + semantic helper classes. **Load this first.** Self-hosts Inter via `@font-face`.
- **`fonts/`** — Inter woff2 (full Latin: 400/500/600/700 + 400 italic), SIL OFL. Self-hosted; no external/CDN web fonts.
- **`SKILL.md`** — Agent-Skills-compatible entry point.
- **`assets/`** — logos, brand marks, motif graphics, device mockups (see below).
- **`preview/`** — small HTML cards that populate the Design System tab (one concept each).
- **`ui_kits/`** — interactive product recreations:
  - `ui_kits/marketing/` — nilesecure.com marketing site (`index.html` + components).
  - `ui_kits/portal/` — Nile Portal operator dashboard (`index.html` + components).
- **`slides/`** — presentation slide templates derived from the PPTX (`index.html` + per-layout JSX).

### `assets/` inventory
| File | What |
|---|---|
| `nile-logo.png` / `nile-logo-white.png` | Primary logo: orange-coral shield + "nile" wordmark (blue / white mono) |
| `nile-shield.png` / `nile-shield-white.png` | Shield mark only |
| `brand-mark.svg`, `brand-mark-quote.png` | Orange-coral twin-leaf decorative mark |
| `brand-badge.svg` | White circle badge w/ orange mark |
| `hero-orb-wave.jpg` | Hero: orange orb logo riding a blue twisted-ribbon wave |
| `wave-blue-bottom.jpg`, `orb-blue-particles.png` | Blue wave / blue orb + particle backgrounds |
| `particle-swoosh.jpeg` | Blue dotted particle-swarm trail on white |
| `glow-soft.png` | Soft sky-blue radial halo |
| `device-phone.png`, `device-laptop.png` | Light-blue line-art device mockups (empty screens) |
| `node-cylinder.png` | Blue 3D cylinder (network node / data illustration) |

---

*Maintained as a living system — see SKILL.md for how agents should use it.*
