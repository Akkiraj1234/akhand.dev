- [ ] fix mainlayout.jsx rendring process where its render logo in awakrd way and then renderd its should be clean
- [ ] make mainlayout.jsx compatible with blank data rendering
- [ ] make hero.jsx compatible wth blank data rendeirng

# Runtime data loading plan

Goal: render the static portfolio immediately, then safely replace cached live
data with fresh API data without allowing one failed request to break the site.

## Phase 1 — define the data contract

- [ ] Keep `src/data/master.json` for permanent static content only: site
      identity, hero copy, links, section labels, and safe fallback content.
- [ ] Define a runtime resource shape for every API-backed feature:
      `{ data, status, updatedAt, expiresAt, error }`.
- [ ] Use only these statuses: `loading`, `ready`, `empty`, `stale`, and
      `error`.
- [ ] Store API resources separately (`activeRepos`, `pinnedRepos`,
      `activity`, etc.); never use one global "site loaded" flag.
- [ ] Rename `runtime.site-config` fields that contain endpoint paths; they
      are routes, not API keys.

## Phase 2 — initial render and safe sections

- [ ] Render `master.json` content as the first Preact render. Do not wait for
      `/init` or any API request before rendering Header, Hero, Footer, and
      section headings.
- [ ] Make every dynamic section handle all five resource states.
- [ ] Show a skeleton/loading layout when there is no data and the request is
      in progress; do not leave an unexplained blank space.
- [ ] Show a clear empty state only when the API successfully returns no data.
- [ ] Add a small error boundary around major dynamic sections so a component
      error cannot take down the rest of the page.

## Phase 3 — shared authentication

- [ ] Create one token manager used by every API request and SSE connection.
- [ ] Reuse the saved JWT until it is close to expiry (refresh it 30–60 seconds
      before its `exp` time); do not call `/init` per request.
- [ ] Keep the token lifetime separate from live-data cache lifetimes.
- [ ] On one `401` response, clear the old token, get a new one, and retry the
      failed request once. Surface an error after the retry fails.
- [ ] Decide with the backend whether `/init` should eventually set an
      `HttpOnly`, `Secure`, `SameSite` cookie. Until then, do not cache any
      sensitive data in browser storage.

## Phase 4 — cache-first data loading

- [ ] Cache each public API resource independently with `data`, `updatedAt`,
      and `expiresAt`. Start with `localStorage`; consider IndexedDB only if
      heatmap/event data becomes large.
- [ ] At bootstrap: read valid cached data first and put it into `siteData` so
      the UI can render it immediately.
- [ ] If cache is expired, still display it as `stale` while a background
      refresh runs (stale-while-revalidate).
- [ ] If refresh succeeds, replace the cached value and update subscribers.
- [ ] If refresh fails but cached data exists, retain it and show a subtle
      warning: "Showing saved data; could not check for updates." Include a
      last-updated time and optional Retry action.
- [ ] If refresh fails with no cached data, show an error state and Retry
      action.

## Phase 5 — refresh policy and scheduling

- [ ] Centralize scheduling in one data coordinator; do not put independent
      `setInterval` loops in page components.
- [ ] Start with conservative TTLs: active repos/events 10–15 minutes,
      pinned repos 30–60 minutes, heatmaps 6–24 hours.
- [ ] Refresh stale resources on app start and when the browser tab becomes
      visible again. Browsers throttle timers in background tabs, so do not
      rely on exact interval timing.
- [ ] Use exponential backoff after errors rather than retrying repeatedly.
- [ ] Prefer backend-provided `updatedAt`, `nextUpdateAt`, `ETag`, or
      `Cache-Control` headers when they become available; these are more
      reliable than client guesses.

## Phase 6 — backend requirements

- [ ] Enable CORS in `akki-core-backend` for `https://akhand.dev` and the
      local development origin. Allow `GET`, `POST`, `OPTIONS`, and the
      `Authorization` / `Content-Type` headers.
- [ ] Ensure preflight `OPTIONS` requests succeed for protected routes.
- [ ] Return consistent success/error envelopes plus record update timestamps
      where possible.
- [ ] Consider an API endpoint or response header that tells the frontend when
      heatmap and repository data is expected to change next.

## Phase 7 — SSE (later, not required for the first version)

- [ ] Keep cache TTLs even after SSE exists; SSE can disconnect and users can
      open the site after being away.
- [ ] On an SSE "resource changed" event, invalidate only that resource and
      fetch it again.
- [ ] Reconnect SSE with a renewed token when the JWT expires or the connection
      closes.

## Validation checklist

- [ ] Test first visit with an empty browser cache.
- [ ] Test refresh with valid cached data and valid JWT.
- [ ] Test expired JWT renewal.
- [ ] Test a failed API refresh with cached data: content stays visible and a
      warning appears.
- [ ] Test a failed first request with no cache: section shows an error but the
      rest of the site works.
- [ ] Test one resource failing while another succeeds.
- [ ] Test slow 3G/mobile throttling and a background-tab return.

