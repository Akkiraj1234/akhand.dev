# Runtime data lifecycle

## Contents

- [Source of truth](#source-of-truth)
- [Bootstrap and fetch](#bootstrap-and-fetch)
- [Record shape and UI states](#record-shape-and-ui-states)
- [Cache and refresh](#cache-and-refresh)

## Source of truth

`src/data/site.js` is the client-side source of truth. Components read a key
with `useSite(key)` and re-render when `site.put(key, value)` updates it.

`src/data/master.json` provides the initial shape, and `runtime.site-config`
maps each site-store key to an API route. The backend is the source of fresh
runtime data; the browser cache is only a fallback.

## Bootstrap and fetch

1. `App` calls `bootstrap()` when it mounts.
2. Bootstrap restores the newest valid browser cache, if available.
3. It obtains a frontend JWT from `POST /init` when needed.
4. `startService()` fetches every valid `runtime.site-config` route at the same time using the authenticated request function.
5. Each success updates the site store and all successful records are saved as one browser-cache snapshot.

Routes and authentication are defined in the backend [route reference](https://github.com/Akkiraj1234/akki-core-backend/blob/main/docs/routes.md).

## Record shape and UI states

Each runtime key, such as `currently`, `feature-repo`, or `heatmap`, has this shape:

```js
{
  "site-load-status": "loading" | "ready" | "error",
  "site-data-status": "old" | "new" | "error",
  data: unknown
}
```

| Situation | Load status | Data status | `data` |
| --- | --- | --- | --- |
| No cache; request is running | `loading` | `old` | `null` |
| Cache restored | `ready` | `old` | cached payload |
| Fresh route request succeeds | `ready` | `new` | current API payload |
| Route request fails with cached data | `ready` | `error` | cached payload |
| Route request fails without data | `error` | `error` | `null` |

Components use these fields for loading, stale-data, and error UI, then read their content from `record.data`.

`unwrap()` accepts a route success envelope, `{ ok: true, data }`, after `request()` checks `ok`. It also supports the backend’s normalized service and record forms described in the [response contracts](https://github.com/Akkiraj1234/akki-core-backend/blob/main/docs/contracts.md).

## Cache and refresh

Successful records are written to `localStorage` and mirrored in a cookie. On startup, the newest valid snapshot wins and its records are marked `old` until fresh data replaces them.

After each batch, an all-success result waits for `runtime.refresh-interval` (five minutes by default). Failed routes shorten the next delay in proportion to the failure rate, with a 30-second minimum. This retries outages sooner without creating a tight retry loop. `stopService()` cancels the timer when the app unmounts.
