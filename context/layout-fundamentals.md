# Layout Fundamentals (Next.js App Router + Tailwind CSS)

This file is **app-agnostic** — no project-specific tokens, colors, or copy. It documents structural layout rules and the CSS mechanics behind them, so they transfer directly to any Next.js (App Router) + Tailwind CSS project. Copy this file into a new project's `context/` folder as-is; only the app-specific *values* (the actual max-width number, the actual padding scale) belong in that project's own `ui-rules.md`/`ui-tokens.md`, which should reference this file for the "why."

---

## Rule 1 — One shared page-container component, never a hand-rolled `<main>`

Every page's top-level content wrapper (typically a `<main>`) must render through a single shared component (e.g. `components/shared/page-container.tsx`). No page should write its own `<main className="mx-auto max-w-... px-... py-...">` inline.

**Why this is a hard rule, not a style preference:** a page-width bug fixed on one page does not fix it on the others. If the wrapper className is duplicated across pages, the same mistake (see Rule 2) gets reintroduced piecemeal, and different pages can silently drift to different effective widths even when their source reads identically — see Rule 3.

The header/navbar's inner content row should be capped at the **same** max-width constant as the page container, so the navbar's left/right edges always line up with the content below it. Two independent max-width values (one for the navbar, one for pages) will visually disagree the moment either one changes.

If a project genuinely needs more than one page width (e.g. a wide dashboard vs. a narrow settings page), make that a deliberate, explicit decision and prefer ONE width applied everywhere unless there's a strong reason not to — a sitewide width that varies page-to-page reads as inconsistent/unpolished even when each individual page is "correct" relative to its own spec. If you do need a variant, parameterize the one shared component (e.g. a `size`/`maxWidth` prop) rather than letting individual pages opt out of it with their own className.

---

## Rule 2 — `mx-auto max-w-*` needs an explicit `w-full` whenever the parent is a flex (or grid) container

This is the single most common way Rule 1 gets violated silently, and it produces a real, hard-to-spot bug:

**The setup:** a root layout commonly looks like this (e.g. for a sticky footer or a full-height app shell):

```tsx
<body className="flex min-h-full flex-col">
  <Navbar />
  {children}  {/* a page's <main className="mx-auto max-w-[1280px] ..."> */}
</body>
```

**The bug:** `<body>` is `display:flex; flex-direction:column`. Its children (`<Navbar>`, `<main>`) are flex items. The CSS Flexbox spec says that when a flex item has `margin: auto` on the **cross axis** (here, horizontal — since the flex direction is column, the cross axis is the row axis), those auto margins **absorb the available free space instead of letting `align-items: stretch` resize the box**. In plain terms: `mx-auto` on a flex item competes with `align-items: stretch` for the same leftover space, and the auto margins win. The element's width collapses to its own **content size** (shrink-to-fit / fit-content), not the full available width capped by `max-width`.

**Why it's so easy to miss:** the element doesn't disappear or break visibly — it just renders *narrower than intended*, and by an amount that depends entirely on that page's own content. A page whose content happens to be wide (long text, a wrapping filter row, a table) can look "close enough" to correct and pass a casual visual check. A page using a CSS Grid with `auto-fill`/`fr` tracks is the type of content most likely to expose this bug loudly and unambiguously, because `auto-fill` track count depends on knowing the container's real available width — feed it a container that's silently shrunk to fit-content, and it can collapse to far fewer columns than intended (in the worst case, just one). Two pages built with the *identical* container className can end up rendering at *different* widths purely because their content differs — which reads as "the pages don't use the same width," even though the source code says otherwise.

**The fix:** always pair `mx-auto max-w-{N}` with an explicit `w-full` (`width: 100%`) on the same element, whenever that element's parent is a flex or grid container:

```tsx
// Wrong — silently shrinks to content width inside a flex parent
<main className="mx-auto max-w-[1280px] px-6">

// Right — stretches to fill, then caps at max-width
<main className="mx-auto w-full max-w-[1280px] px-6">
```

`width: 100%` + `max-width: {N}` is the correct "stretch, then cap" pattern. `margin: auto` alone only centers an element that already has a definite width from somewhere else — inside a flex parent, it does not also establish that width for you.

**Note on scope:** this specific failure mode requires the immediate parent to be a flex (or grid) container. A `<main>` inside a plain block-layout parent (no `display: flex`/`grid` on the parent) does not need `w-full` — a block-level element with `width: auto` already fills its container by default, and `margin: auto` then correctly centers it within that already-full width. Check what the *direct* parent's `display` is before assuming this fix is or isn't needed.

**How to catch this during initial scaffolding, not after multiple pages have shipped:** when first setting up the page-container pattern, build (or test against) at least one page that uses a CSS Grid with `auto-fill`/`minmax(...,1fr)` tracks, and verify via devtools (or an automated check of `getComputedStyle(main).width` against the viewport) that the container actually reaches its intended max-width on a viewport wider than that max-width. A page made only of normal block/flex-wrap content will not reliably surface this bug — don't rely on "it looks fine" from a page that was never going to expose it in the first place.

---

## Rule 3 — Auth middleware/proxy must exclude static assets by file extension, not just framework-internal paths

If the project uses Next.js Middleware (or `proxy.ts` in newer Next.js versions) to redirect unauthenticated requests, the `config.matcher` must exclude **actual static asset files** (images, fonts, icons), not just the framework's own internal paths.

**The common mistake:**

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

This excludes Next's *internal* optimization/static routes, but **not** a real asset sitting in `/public` and referenced by a leading-slash path, e.g. `/logo.png`. A request for that path still runs through the middleware.

**Why this breaks images specifically:** `next/image`'s optimizer performs its own internal server-side fetch of the source file. That internal fetch does not carry the original browser request's session cookies. If your middleware redirects "no session" requests to a login page, that internal fetch gets redirected too — the optimizer receives an HTML login page where it expected image bytes, fails to parse it, and the image breaks (commonly a `400` response, "the requested resource isn't a valid image"). **This reproduces even for a fully logged-in user**, because the failure happens on the server's own internal fetch, which is a separate, cookie-less request — not the original authenticated browser request.

**The fix — exclude by file extension:**

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf)$).*)",
  ],
};
```

Add any other static extensions the project actually serves from `/public` (e.g. `.pdf`, `.mp4`). This is Next.js's own documented guidance for this exact file convention — middleware/proxy without a properly scoped matcher "can unintentionally block CSS, JS, or images from loading."

---

## Checklist for a new project reusing this layout system

- [ ] One shared page-container component; every page imports it, none hand-roll the wrapper className.
- [ ] Navbar/header content row capped at the exact same max-width constant as the page container.
- [ ] That shared component's className includes `w-full` alongside `mx-auto max-w-*` if its parent (root layout `<body>`, typically) is `flex` or `grid`.
- [ ] At least one early page uses a CSS Grid with `auto-fill`/`fr` tracks, specifically to surface Rule 2's bug immediately if it's present, rather than weeks later.
- [ ] If using auth middleware/proxy, its matcher excludes static asset extensions, not just `_next/static`/`_next/image`.
- [ ] Picked one page max-width for the whole app unless there's a deliberate, documented reason for more than one.
