import { startService, load_cached_data } from "@/services/runtimeDataService";
import { getCookie, tokenIsUsable } from "@/services/utils"
import site from "@/data/site";

const TOKEN_COOKIE = "akhand.dev_init_token";
const REFRESH_BUFFER_SECONDS = 30;
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


// Runtime fetchers receive this, not a JWT/header getter. It owns JWT state,
// authorization headers, JSON parsing, and one safe 401 retry.
async function request(path, options = {}, retried = false) {

    const token = await getValidToken();
    const response = await fetch(`${apiUrl()}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });
    const body = await response.json().catch(() => null);

    if (response.status === 401 && !retried) {
        await getValidToken({ forceRefresh: true });
        return request(path, options, true);
    }

    if (!response.ok || !body?.ok) {
        throw responseError(response, body, path);
    }

    return body;
}


function bootstrap() {
    /*
    1. load the cashed data ( 
        if data is undefined or null then it will show loading, 
        if data then its load the data, 
        if error then show failed to fatch and error message )
    2. start the all services

    note: at refresh its try load cash and then start the service
        when refreshed again its again load cash load, and load from cash
        then after its start service again but its lazy reload
        the jwt token only get refreshed when its invalid bootstrap 
        has no effect on jwt token and it will fatch all data from server again
        on refresh
    */
    if (bootstrapInFlight) return bootstrapInFlight;
    
    bootstrapInFlight = ( () => {
        load_cached_data()

        start_service({
            request,
            save_cash: save_cached_data,
        });
    
    })().finally(() => {
        bootstrapInFlight = null;
    })

    return bootstrapInFlight;
}

export default bootstrap;
export {
    bootstrap,
    request
}