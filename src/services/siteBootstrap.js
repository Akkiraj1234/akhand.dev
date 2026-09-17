import { startService, load_cached_data } from "@/services/runtimeDataService";
import { getCookie, tokenIsUsable } from "@/services/utils"
import site from "@/data/site";

const TOKEN_COOKIE = "akhand.dev_init_token";
let tokenRefreshInFlight = null;
let bootstrapInFlight = null;



function apiUrl() {
    return String(site.get("runtime")?.["api-url"] ?? "https://api.akhand.dev")
        .replace(/\/$/, "");
}

function saveToken(token) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
        `${encodeURIComponent(TOKEN_COOKIE)}=${encodeURIComponent(token)}; ` +
        `Path=/; Max-Age=3540; SameSite=Lax${secure}`;
}

function clearToken() {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
        `${encodeURIComponent(TOKEN_COOKIE)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}


async function createToken() {
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


function responseError(response, body, path) {
    const error = new Error(body?.message ?? `Could not load ${path}.`);
    error.status = response.status;
    return error;
}


async function request(path, { method = "GET", headers = {}, body, query } = {}, retried = false) {
    /*
    Runtime fetchers receive this, not a JWT/header getter. It owns JWT state,
    authorization headers, JSON parsing, and one safe 401 retry.
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
       - If cached data exists, load it immediately and mark the data as stale.
       - If no cached data exists, show the loading state.
       - Cached data allows the site to render while fresh data is being fetched.

    2. Start all services.
       - Services fetch the latest data from the server.
       - Once the live data is available, replace the cached data with it.
       - If fetching fails, keep the cached data when available and expose
         the service errors.

    Refresh behavior:

    On every page refresh, bootstrap starts again.
    It first attempts to restore cached data, then starts the services
    to fetch fresh data from the server.

    This means cached data is used as the initial state while the live
    data is refreshed in the background.

    Bootstrap does not manage the JWT token.
    Token refresh is handled by the authentication layer and only occurs
    when the current token is invalid or needs to be refreshed.

    Bootstrap state:

    site-load-status
        "loading" → waiting for initial data when no cache is available.
        "ready"   → fresh data has been successfully loaded.
        "error"   → no usable data is available and the fetch failed.

    error
        Contains service errors when one or more services fail.

    data
        The currently available data. Cached data may be displayed while
        the live data is being fetched and is replaced when fresh data arrives.
    */
    if (bootstrapInFlight) return bootstrapInFlight;
    
    bootstrapInFlight = ( async () => {
        const hasCachedData = await load_cached_data();
        
        // a boootstrap info is just normal info that if boostrap happen or not
        site.put("bootstrap", {
            "site-load-status": hasCachedData ? "ready" : "loading",
            "site-update": "old" ,
            data: null,
        });

        const result = await startService({
            request
        });

        // but then how site gonna know if 
        site.put("bootstrap", {
            "site-load-status": result.status === 200 ? "ready" : "error",
            "site-update": "old" ,
            data: null,
        })

        const hasLiveData = result.activeRepos.ok || result.pinnedRepos.ok;

        site.put("bootstrap", {
            status: hasLiveData ? "ready" : (hasCachedData ? "stale" : "error"),
            error: hasLiveData ? null : {
                activeRepos: result.activeRepos.error ?? null,
                pinnedRepos: result.pinnedRepos.error ?? null,
            },
        });

    })().finally(() => {
        bootstrapInFlight = null;
    })

    return bootstrapInFlight;
}

export default bootstrap;
export { bootstrap, request }