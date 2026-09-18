import {
    currently_formater,
    featureRepo_formater,
    heatmap_formater,
    getCookie,
} from "@/services/utils";
import site from "@/data/site";


const CACHE_KEY = "akhand.dev:runtime-data";
const CACHE_COOKIE_KEY = "akhand.dev_runtime_data";
const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const FORMATTERS = {
    currently: currently_formater,
    "feature-repo": featureRepo_formater,
    heatmap: heatmap_formater,
};


let refreshTimer = null;
let isServiceActive = false;
let fetchedData = [];



function unwrap(response) {
    /*
    Extract usable data from a validated API response. The backend contracts
    define `{ data, error, code }`; the routes return `{ ok: true, data }`,
    which `request()` validates before this function runs. Record-shaped
    responses are supported for compatibility.
    */
    if (!response || typeof response !== "object") {
        throw new Error("Invalid service response.");
    }

    // Handle errors raised while fetching or processing the request.
    if (response.error != null) throw response.error;
    // Handle errors returned by the server.
    if (response.record?.data?.error != null) throw response.record.data.error;

    const data = response.record?.data?.data ?? response.data;
    if (data === undefined) throw new Error("Service response contains no data.");

    return data;
}


function getRefreshIntervalMs() {
    /*
    Return the normal refresh interval configured in runtime data.
    Returns the default interval when the configured value is invalid.
    */
    const runtime = site.get("runtime") ?? {};
    const interval = Number(runtime["refresh-interval"]);

    return Number.isFinite(interval) && interval > 0
        ? interval
        : DEFAULT_REFRESH_INTERVAL_MS;
}


function formatRouteData(key, data) {
    /*
    Convert route payloads to the shape consumed by their site-store key.
    `github/activerepo` returns repository records, while the Currently section
    displays a labelled object containing normalized projects.
    */
    const formater = FORMATTERS[key];

    if (typeof formater !== "function") {
        return data;
    }

    return formater(data);
}


function saveCachedData(entries = []) {
    /*
    Save the payload to localStorage and the cookie.
    localStorage is the primary cache, while the cookie provides a
    fallback when localStorage is unavailable.
    */
    const payload = {
        savedAt: new Date().toISOString(),
        entries,
    };

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
        console.warn("Unable to save cache in localStorage.");
    }

    try {
        const secure = location.protocol === "https:" ? "; Secure" : "";
        const cookieName = encodeURIComponent(CACHE_COOKIE_KEY);
        const cookieValue = encodeURIComponent(JSON.stringify(payload));

        document.cookie =
            `${cookieName}=${cookieValue}; ` +
            `Path=/; Max-Age=31536000; SameSite=Lax${secure}`;

    } catch {
        console.warn("Unable to save cache in cookie.");
    }
}


function load_cached_data() {
    /*
    Restore the site data cache snapshot from localStorage or cookies.
    If no valid cache is found, fresh data will be loaded instead.
    Return true when cached data is restored, otherwise return false.
    */
    const parseCachedData = (source) => {
        try {
            const payload = JSON.parse(source ?? "null");
            return Array.isArray(payload?.entries) ? payload : null;
        } catch {
            return null;
        }
    };

    const cacheSavedAt = (payload) => {
        const savedAt = Date.parse(payload?.savedAt);
        return Number.isFinite(savedAt) ? savedAt : 0;
    };

    // Collect valid cached data and use the latest snapshot.
    const cachedPayloads = [
        () => localStorage.getItem(CACHE_KEY),
        () => getCookie(CACHE_COOKIE_KEY),
    ]
        .map((callable) => {
            try {
                return parseCachedData(callable());
            } catch {
                console.warn("Unable to read cache.");
                return null;
            }
        })
        .filter(Boolean)
        .sort((a, b) => cacheSavedAt(b) - cacheSavedAt(a));

    const cachedData = cachedPayloads[0];
    if (!cachedData) return false;

    // Restore the cached data.
    for (const { key, value } of cachedData.entries) {
        if (!key || !value || typeof value !== "object" || Array.isArray(value)) {
            continue;
        }

        site.put(key, {
            data: formatRouteData(key, value),
            "site-load-status": "ready",
            "site-data-status": "old",
        });
    }

    return true;
}


async function fetchAndUpdateData({ request, saveAt, fetchPath }) {
    /*
    Fetch and update the site data for a route.
    On success, store the new data and add it to the fetched data list.
    On failure, preserve existing data when available and mark the data
    status as an error. Return true when data is fetched successfully,
    otherwise return false.
    */
    const path = `/${fetchPath.replace(/^\/+/, "")}`;

    try {
        const data = formatRouteData(
            saveAt, 
            unwrap(await request(path))
        );
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













function scheduleNextRefresh({ request, results }) {
    if (!isServiceActive) return;
    if (refreshTimer) clearTimeout(refreshTimer);

    refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (isServiceActive) startService({ request });
    }, getNextRefreshDelay(results));
}





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
