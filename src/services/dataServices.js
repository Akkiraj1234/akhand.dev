import { getCookie, toProject } from "@/services/utils";
import site from "@/data/site";

const CACHE_KEY = "akhand.dev:runtime-data";
const CACHE_COOKIE_KEY = "akhand.dev_runtime_data";
const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const MIN_RETRY_INTERVAL_MS = 30 * 1000;

let refreshTimer = null;
let isServiceActive = false;
let fetchedData = [];

/**
 * Extract usable data from a validated API response. The backend contracts
 * define `{ data, error, code }`; the routes return `{ ok: true, data }`,
 * which `request()` validates before this function runs. Record-shaped
 * responses are supported for compatibility.
 *
 * @param {object} response A validated response returned by `request()`.
 * @returns {*} The route payload.
 * @throws {Error|object} When the response is invalid, failed, or has no data.
 */
function unwrap(response) {
    if (!response || typeof response !== "object") {
        throw new Error("Invalid service response.");
    }

    if (response.error != null) throw response.error;
    if (response.record?.data?.error != null) throw response.record.data.error;

    const data = response.record?.data?.data ?? response.data;
    if (data === undefined) throw new Error("Service response contains no data.");

    return data;
}

/**
 * Convert route payloads to the shape consumed by their site-store key.
 * `github/activerepo` returns repository records, while the Currently section
 * displays a labelled object containing normalized projects.
 *
 * @param {string} key Site-store key.
 * @param {*} data Raw route payload.
 * @returns {*} Data ready for the matching component.
 */
function formatRouteData(key, data) {
    if (key === "currently") {
        return {
            label: "Currently building",
            projects: (Array.isArray(data) ? data : []).map(toProject),
        };
    }

    return data;
}

/**
 * Return the normal refresh interval configured in runtime data.
 *
 * @returns {number} A positive interval in milliseconds.
 */
function getRefreshIntervalMs() {
    const runtime = site.get("runtime") ?? {};
    const interval = Number(runtime["refresh-interval"]);

    return Number.isFinite(interval) && interval > 0
        ? interval
        : DEFAULT_REFRESH_INTERVAL_MS;
}

/**
 * Determine the next retry delay from a completed fetch batch. Failures shorten
 * the delay proportionally, down to 30 seconds when every route failed.
 *
 * @param {boolean[]} results One result per configured route.
 * @returns {number} The delay before the next batch, in milliseconds.
 */
function getNextRefreshDelay(results = []) {
    const normalInterval = getRefreshIntervalMs();
    if (!results.length) return normalInterval;

    const failureRatio = results.filter((result) => !result).length / results.length;
    if (!failureRatio) return normalInterval;

    return Math.max(
        MIN_RETRY_INTERVAL_MS,
        Math.round(normalInterval * (1 - (0.9 * failureRatio)))
    );
}

/**
 * Mirror a cache payload to a cookie as a fallback when localStorage is not
 * available on a later visit.
 *
 * @param {object} payload The serializable cache payload.
 */
function writeCacheCookie(payload) {
    try {
        const secure = location.protocol === "https:" ? "; Secure" : "";
        const cookieName = encodeURIComponent(CACHE_COOKIE_KEY);
        const cookieValue = encodeURIComponent(JSON.stringify(payload));

        document.cookie =
            `${cookieName}=${cookieValue}; ` +
            `Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
        // Cookie storage can be unavailable or the payload can be too large.
    }
}

/**
 * Persist successfully fetched records to localStorage and a cookie fallback.
 *
 * @param {{ key: string, value: object }[]} entries Records to restore later.
 */
function saveCachedData(entries = []) {
    const payload = { savedAt: new Date().toISOString(), entries };

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
        // Fresh in-memory data remains usable when storage is unavailable.
    }

    writeCacheCookie(payload);
}

/**
 * Parse and validate a serialized cache payload.
 *
 * @param {string|null|undefined} source A value read from browser storage.
 * @returns {{ savedAt: string, entries: object[] }|null} A valid payload or null.
 */
function parseCachedPayload(source) {
    try {
        const payload = JSON.parse(source ?? "null");
        return Array.isArray(payload?.entries) ? payload : null;
    } catch {
        return null;
    }
}

/**
 * Convert a cache timestamp to a safely comparable value.
 *
 * @param {object} payload A parsed cache payload.
 * @returns {number} Milliseconds since epoch, or zero for an invalid date.
 */
function cacheSavedAt(payload) {
    const savedAt = Date.parse(payload?.savedAt);
    return Number.isFinite(savedAt) ? savedAt : 0;
}

/**
 * Restore the newest valid cache snapshot into the reactive site store.
 * Restored records retain their data but are marked `old` until refreshed.
 *
 * @returns {boolean} True only when a `currently` record was restored.
 */
function load_cached_data() {
    const candidates = [
        () => localStorage.getItem(CACHE_KEY),
        () => getCookie(CACHE_COOKIE_KEY),
    ]
        .map((readSource) => {
            try {
                return parseCachedPayload(readSource());
            } catch {
                return null;
            }
        })
        .filter(Boolean)
        .sort((left, right) => cacheSavedAt(right) - cacheSavedAt(left));

    const cachedValue = candidates[0];
    if (!cachedValue) return false;

    const restoredKeys = new Set();
    for (const { key, value } of cachedValue.entries) {
        if (!key || !value || typeof value !== "object" || Array.isArray(value)) {
            continue;
        }

        site.put(key, {
            ...value,
            "site-load-status": "ready",
            "site-data-status": "old",
        });
        restoredKeys.add(key);
    }

    return restoredKeys.has("currently");
}

/**
 * Schedule the next complete route fetch after the current batch finishes.
 *
 * @param {object} options Scheduling inputs.
 * @param {Function} options.request Authenticated request function.
 * @param {boolean[]} options.results Results from the completed batch.
 */
function scheduleNextRefresh({ request, results }) {
    if (!isServiceActive) return;
    if (refreshTimer) clearTimeout(refreshTimer);

    refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (isServiceActive) startService({ request });
    }, getNextRefreshDelay(results));
}

/**
 * Fetch one configured route, update its site-store record, and stage a
 * successful record for persistence.
 *
 * @param {object} options Fetch configuration.
 * @param {Function} options.request Authenticated request function.
 * @param {string} options.saveAt Site-store key for the route data.
 * @param {string} options.fetchPath API path from `runtime.site-config`.
 * @returns {Promise<boolean>} Whether this route produced fresh data.
 */
async function fetchAndUpdateData({ request, saveAt, fetchPath }) {
    const path = `/${fetchPath.replace(/^\/+/, "")}`;

    try {
        const data = formatRouteData(saveAt, unwrap(await request(path)));
        const value = {
            "site-load-status": "ready",
            "site-data-status": "new",
            data,
        };

        site.put(saveAt, value);
        fetchedData.push({ key: saveAt, value });
        return true;
    } catch {
        const current = site.get(saveAt);
        site.put(saveAt, {
            "site-load-status": current?.["site-load-status"] === "ready"
                ? "ready"
                : "error",
            "site-data-status": "error",
            data: current?.data ?? null,
        });
        return false;
    }
}

/**
 * Build a complete cache snapshot from usable records after a fetch batch.
 * This preserves data from routes that failed this time but still have a
 * previously cached value.
 *
 * @param {[string, string][]} configuredRoutes Valid site-store route entries.
 * @returns {{ key: string, value: object }[]} Records safe to persist.
 */
function cacheUsableRouteData(configuredRoutes) {
    return configuredRoutes.flatMap(([key]) => {
        const value = site.get(key);

        return value?.["site-load-status"] === "ready"
            ? [{ key, value }]
            : [];
    });
}

/**
 * Fetch every valid route in `runtime.site-config` concurrently. Successful
 * records are saved as one cache snapshot before the next batch is scheduled.
 * Authentication and HTTP validation belong to the supplied request function.
 *
 * @param {object} options Service configuration.
 * @param {Function} options.request Authenticated request function.
 * @returns {Promise<boolean>} True when at least one route fetched successfully.
 */
async function startService({ request }) {
    isServiceActive = true;
    fetchedData = [];

    const runtime = site.get("runtime") ?? {};
    const routes = runtime["site-config"] ?? {};
    const configuredRoutes = Object.entries(routes)
        .filter(([, value]) => typeof value === "string" && value.trim());

    for (const [key] of configuredRoutes) {
        const current = site.get(key);

        if (current?.["site-load-status"] !== "ready") {
            site.put(key, {
                ...current,
                "site-load-status": current?.data != null ? "ready" : "loading",
                "site-data-status": "old",
                data: current?.data ?? null,
            });
        }
    }

    const results = await Promise.all(
        configuredRoutes
            .map(([key, value]) => fetchAndUpdateData({
                request,
                saveAt: key,
                fetchPath: value,
            }))
    );

    const cacheEntries = cacheUsableRouteData(configuredRoutes);
    if (cacheEntries.length) {
        saveCachedData(cacheEntries);
        fetchedData = [];
    }

    scheduleNextRefresh({ request, results });
    return results.some(Boolean);
}

/**
 * Stop automatic refreshes and persist only data that has not yet been saved.
 */
function stopService() {
    isServiceActive = false;

    if (fetchedData.length) {
        saveCachedData(fetchedData);
        fetchedData = [];
    }

    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

export { load_cached_data, saveCachedData, startService, stopService };
