import { startService, load_cached_data } from "@/services/runtimeDataService";
import { getCookie, tokenIsUsable } from "@/services/utils"
import site from "@/data/site";

const TOKEN_COOKIE = "akhand.dev_init_token";
let tokenRefreshInFlight = null;
let bootstrapInFlight = null;



function apiUrl() {
    /*
    Return the configured API base URL.

    Uses the runtime configuration when available and falls back to the
    default API endpoint. Trailing slashes are removed so callers can safely
    append API paths.
    */
    return String(site.get("runtime")?.["api-url"] ?? "https://api.akhand.dev")
        .replace(/\/$/, "");
}

function saveToken(token) {
    /*
    Store the initialization JWT in the site cookie.

    The token is scoped to the entire site, expires automatically, and uses
    the Secure attribute when the site is served over HTTPS.
    */
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
        `${encodeURIComponent(TOKEN_COOKIE)}=${encodeURIComponent(token)}; ` +
        `Path=/; Max-Age=3540; SameSite=Lax${secure}`;
}

function clearToken() {
    /*
    Remove the stored initialization JWT.

    The cookie is expired immediately so the next authenticated request
    will create a new token.
    */
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
        `${encodeURIComponent(TOKEN_COOKIE)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function responseError(response, body, path) {
    /*
    Create a normalized API error from a failed response.

    Uses the server-provided message when available and attaches the HTTP
    status code to the error for callers that need to inspect the failure.
    */
    const error = new Error(body?.message ?? `Could not load ${path}.`);
    error.status = response.status;
    return error;
}


async function createToken() {
    /*
    Create a new initialization JWT.

    Requests a token from the API initialization endpoint, validates the
    response, stores the token in the site cookie, and returns it.

    Throws when the initialization request fails or the API response does
    not contain a valid token.
    */
    try {
        const response = await fetch(`${apiUrl()}/init`, { method: "POST" });
        const body = await response.json().catch(() => null);
        
        if (!response.ok || !body?.ok || !body.token) {
            console.error("Failed to initialize site data:", {
                status: response.status,
                statusText: response.statusText,
                body,
            });

            throw new Error(
                body?.message ?? "Could not initialize live site data."
            );
        }

        saveToken(body.token);
        return body.token;

    } catch (error) {
        console.error("Site initialization failed:", error);
        throw error;
    }
}


async function getValidToken({ forceRefresh = false } = {}) {
    /*
    Return a usable initialization JWT.

    Reuses the stored token when it is valid. When the token is missing,
    expired, or a refresh is explicitly requested, creates a new token.

    Concurrent refresh requests share the same in-flight promise so only
    one token initialization request is made at a time.
    */
    const cachedToken = forceRefresh ? null : getCookie(TOKEN_COOKIE);

    if (cachedToken && tokenIsUsable(cachedToken)) {
        return cachedToken;
    }

    clearToken();
    
    if (!tokenRefreshInFlight) {
        tokenRefreshInFlight = createToken().finally(() => {
            tokenRefreshInFlight = null;
        });
    }

    return tokenRefreshInFlight;
}


async function request(path, { method = "GET", headers = {}, body, query } = {}, retried = false) {
    /*
    Make an authenticated request to the runtime API.

    Adds the current initialization JWT to the request, serializes JSON
    request bodies, applies query parameters, and parses the API response.

    A 401 response causes the token to be refreshed and the request to be
    retried once. Other unsuccessful responses are converted into normalized
    errors.

    This function is the request interface exposed to runtime data services;
    callers do not need to manage JWTs or authorization headers themselves.
    */
    const token = await getValidToken();
    const url = new URL(`${apiUrl()}${path}`);

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value != null) {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url, {
        method,
        headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
            ...(body != null && {
                "Content-Type": "application/json",
            }),
        },
        ...(body != null && {
            body: JSON.stringify(body),
        }),
    });
    
    const data = await response.json().catch(() => null);

    // Retry once after refreshing the token.
    if (response.status === 401 && !retried) {
        await getValidToken({ forceRefresh: true });
        return request(path, { method, headers, body, query }, true);
    }

    if (!response.ok || !data?.ok) {
        throw responseError(response, data, path);
    }

    return data;
}


function bootstrap() {
    /*
    Bootstrap process:

    1. Load cached data.
       - load_cached_data() returns true when cached data was restored,
         otherwise false.
       - When cached data exists, the site can immediately display it.
       - When no cached data exists, the site enters the loading state.
       - Cached data is considered old until fresh data is fetched.

    2. Start all services.
       - startService() returns true when fresh data was successfully fetched,
         otherwise false.
       - When fresh data is available, the cached data is replaced with the
         latest data.
       - When fetching fails, cached data remains available when it exists.
       - When both cached and fresh data are unavailable, the site enters
         the error state.

    Refresh behavior:

    Bootstrap runs again on every page refresh.
    It first restores cached data, if available, and then starts the services
    to fetch fresh data from the server.

    This allows the site to display cached data immediately instead of waiting
    for the network request to complete. The cached data remains marked as old
    until fresh data is successfully fetched.

    Bootstrap does not manage the JWT token.
    JWT refresh is handled by the authentication layer and only occurs when
    the current token is invalid or requires refreshing.

    Bootstrap state:

    site-load-status:
        "loading" → no cached data is available and fresh data is being fetched.
        "ready"   → usable data is available, either cached or freshly fetched.
        "error"   → neither cached nor fresh data is available.

    site-data-status:
        "old"   → the currently displayed data came from the cache.
        "new"   → the currently displayed data came from a fresh server fetch.
        "error" → the fresh data fetch failed.

    data:
        Contains the currently available data or an error when fresh data
        could not be fetched and no cached data is available.
    */

    if (bootstrapInFlight) return bootstrapInFlight;

    bootstrapInFlight = (async () => {
        const runtime_data = site.get("runtime");
        const hasCachedData = await load_cached_data();

        site.put("runtime", {
            ...runtime_data,
            "site-load-status": hasCachedData ? "ready" : "loading",
            "site-data-status": "old",
            data: null,
        });

        const result = await startService({
            request,
        });

        site.put("runtime", {
            ...runtime_data,
            "site-load-status": (result || hasCachedData) ? "ready" : "error",
            "site-data-status": result ? "new" : "error",
            data: result ? null : { message: "unable to fetch data" },
        });
    })().finally(() => {
        bootstrapInFlight = null;
    });

    return bootstrapInFlight;
}

export default bootstrap;
export { bootstrap, request }