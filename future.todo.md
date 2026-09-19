# Path to a 9.5/10 runtime-data layer

The current foundation is good: there is one site store, a single authenticated
request path, route formatters, cache-first startup, bounded retries, and
component-level loading/error states. The goal is to make these foundations
reliable without turning a small personal-site runtime into an unnecessarily
large framework.

## P0 — correctness and reliability

* [ ] [ do it ]: Replace the global `fetchedData`-only cache snapshot with a complete per-refresh snapshot built from all usable resources. A partial refresh must not remove another route's still-valid cached data just because that route failed during the current refresh.
* [ ] [ do it ]: Add a single-flight guard to `startService()` so concurrent callers share one refresh instead of starting multiple batches.
* [ ] [ do it ]: Add an `AbortController` per refresh. `stopService()` should abort in-flight requests as well as clear the scheduled refresh timer.
* [ ] [ do it ]: Preserve a normalized error on each resource containing at least `message`, `status`, and whether the failure is retryable. Do not silently discard the original failure in `fetchAndUpdateData()`.
* [ ] [ do it ]: Retry only transient failures such as network failures, `408`, `429`, and `5xx` responses. Do not retry invalid routes or other permanent `4xx` responses.
* [ ] [ do it ]: Keep the retry strategy small: one immediate retry for retryable failures, followed by the normal refresh cycle. Add simple backoff only where repeated failures make it useful.
* [ ] [ do it ]: Add cache versioning and validate `savedAt`, entry keys, and basic resource shape before restoring a cache snapshot. Ignore invalid or incompatible snapshots safely.
* [ ] [ maybe ]: Add independent resource `updatedAt` and `expiresAt` values and introduce a `stale` state. This is useful if different resources eventually need different cache lifetimes, but is not necessary while the runtime has only a small number of resources with one refresh policy.

## P1 — security and transport

* [ ] [ do it ]: Stop mirroring runtime data into cookies. Use `localStorage` as the runtime-data cache. Cookies should remain focused on small authentication-related values.
* [ ] [ maybe ]: Move the frontend JWT to a backend-set `HttpOnly`, `Secure`, `SameSite` cookie when the backend authentication flow is ready for it. Do not restructure the authentication system solely for this cleanup.
* [ ] [ do it ]: Verify backend CORS for the local Vite origin and `https://akhand.dev`, including the required `Authorization` and `Content-Type` headers and `POST /init` preflight behavior.
* [ ] [ do it ]: Add request timeouts through `AbortSignal.timeout()` with a compatible fallback. Distinguish timeout failures from API response failures.

## P1 — contracts and architecture

* [ ] [ do it ]: Keep one clear resource contract throughout the runtime service. Evolve the existing `site-load-status`, `site-data-status`, and `data` model rather than introducing a large new state abstraction.
* [ ] [ do it ]: Validate API payloads at the service boundary before passing them to route formatters. Use small hand-written validators where the resource shape requires them.
* [ ] [ do it ]: Rename the misspelled formatter exports from `*_formater` to `*Formatter` and update their callers.
* [ ] [ do it ]: Remove `cacheUsableRouteData()` if the new complete-cache snapshot implementation no longer needs it. Do not retain duplicate
  store traversal merely to reconstruct data already collected during
  fetching.

* [ ] [ maybe ]: Move endpoint configuration and refresh/cache policy out of
  `master.json` into a dedicated runtime configuration module. Keep the
  current setup if separating these concerns would add more complexity
  than value for the personal site.

* [ ] [ maybe ]: Introduce explicit per-resource policies containing endpoint,
  formatter, TTL, retry policy, cache key, and persistence behavior only
  when the resources begin to need different policies.

## P2 — store and hook quality

* [ ] [ do it ]: Update `useSite()` to synchronously read `site.get(key)` when
  `key` changes before subscribing to the new key. This prevents a
  component from briefly displaying the previous resource's value.

* [ ] [ maybe ]: Consider `useSyncExternalStore` or Preact's equivalent if the
  store grows more complex or concurrent rendering becomes relevant.

* [ ] [ do not ]: Do not introduce a large store abstraction or replace the
  current store solely for architectural purity. The existing store is
  small and already separates state storage from subscriptions.

* [ ] [ do not ]: Do not redesign `Store.put()` listener handling unless an
  actual failure mode requires it. Listener failures are already isolated
  from individual listeners and should not justify a larger store rewrite.

* [ ] [ maybe ]: Add a small reset/test factory for the store if tests begin
  sharing singleton state. Keep this test-only and avoid complicating the
  production store API unnecessarily.

## P2 — verification and operations

* [ ] [ do it ]: Unit-test cache parsing and versioning, malformed resource
  data, retry classification, and the important cache state transitions.

* [ ] [ do it ]: Add request tests for valid token reuse, concurrent token
  refresh, one `401` refresh/retry, and final authentication failure.

* [ ] [ do it ]: Add data-service integration tests for empty-cache startup,
  cached-data fallback when one route fails, all-route failure, retry
  success, concurrent `startService()` calls, and `stopService()`
  cancellation.

* [ ] [ do it ]: Add component tests for the resource states that actually
  exist in the application, especially loading, ready, old/stale, and
  error states.

* [ ] [ maybe ]: Add lightweight structured diagnostics for resource failures
  and cache-restore failures without logging tokens or sensitive response
  bodies.

## Deferred complexity

* [ ] [ do not ]: Do not build a generic enterprise-grade retry framework for
  three runtime resources.
* [ ] [ do not ]: Do not introduce IndexedDB until the runtime cache actually
  becomes too large or unreliable for `localStorage`.
* [ ] [ do not ]: Do not introduce a schema-validation library unless the
  number or complexity of API contracts makes hand-written validation
  difficult to maintain.
* [ ] [ do not ]: Do not introduce a large `loading`/`ready`/`empty`/`stale`/
  `error` state machine unless the UI genuinely needs those distinctions.
* [ ] [ do not ]: Do not create a generic route-policy registry for every
  resource while the runtime only has a few simple routes.
* [ ] [ do not ]: Do not optimize the architecture for an arbitrary
  "9.5/10" score. Prioritize correctness, failure handling, and
  maintainability over additional abstraction.
