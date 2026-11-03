# 0001. Saved filter state for the Tasks page: rationale

_Decision history for [index.md](index.md)._

## Context

Feature 33 made the four Tasks filters live, but all of it is local React state in `components/tasks/tasks-view.tsx`. Opening a task and pressing Back, refreshing, or clicking Tasks in the navbar resets the page to an unfiltered Kanban. That breaks the main working loop (filter, open a task, come back, open the next one), and it is worse on Gantt, which users must switch to again every time.

Forces:
- `app/tasks/page.tsx` is a dynamic Server Component (it reads the auth cookie), and it already fetches every option list (projects, initiatives, profiles) the filters need. So it can check any saved value against real ids.
- Browser storage is only readable on the client, after the server has already rendered.
- Task Detail's Back button is a bare `router.back()`. When the task was opened from a bookmark or a new tab, that leaves the app or does nothing.
- Tasks arrive live over InsForge Realtime, and the user can create tasks from the page. Both can produce tasks the active filters hide.
- Feature 11 decided the view toggle is local `useState`, not a URL param. The developer has already agreed to override that for this page only.
- More than one person may sign in on the same browser.

## Options considered

### Option 1: URL query as the live mirror, plus a per user browser memory (localStorage)

State lives in React. Every change is mirrored to the URL with the native `window.history.replaceState` and saved to localStorage. The server page parses the URL for the first render; a bare `/tasks` holds the filter row and board for one frame while the client restores from storage.

**Pros**: Back, refresh and bookmarks work through the URL alone; the navbar link restores too; no server round trip per click; shareable links.
**Cons**: The bare `/tasks` path needs a one frame hold; state is kept in two places that must stay in sync.

### Option 2: URL query only

Same URL mirror, no browser memory.

**Pros**: One source of truth, no hold on first render.
**Cons**: The navbar Tasks link (a bare `/tasks`) always resets, which is the most common way users reach the page.

### Option 3: URL query plus a cookie the server reads

Save the state in a cookie, so the server renders the restored state directly.

**Pros**: No hold at all, even on bare `/tasks`.
**Cons**: Reverses the storage the developer already chose; a cookie travels with every request; cookie writes from the client are clumsier, and it is one more place auth related bugs can hide.

### Option 4: Keep state in a client store that outlives navigation (React context in the root layout)

**Pros**: No URL format to design.
**Cons**: Lost on refresh and new tabs, not shareable; does not fix the bookmark Back case.

## Rationale

The URL is the only state that Back, refresh and bookmarks all carry for free, so it has to hold the view and filters. That alone leaves the navbar link resetting the page, and that link is the most common way into the page, so a browser memory is needed as well. localStorage keeps the developer's decision and adds no server work. Its one cost (it is unreadable during the server render) is fixed with a one frame hold that only happens on a bare `/tasks`.

Validating ids on the server, against lists `page.tsx` already fetches, makes stale bookmarks heal themselves at no extra query cost. Mirroring with `replaceState` matters because the page is dynamic: anything that reruns `page.tsx` refetches every task.

Keying storage by user id is a single string. It closes a real leak on shared machines, where one person's filters would otherwise show up for another.
