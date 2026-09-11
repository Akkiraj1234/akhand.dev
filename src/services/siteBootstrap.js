import site from "@/data/site";

const TOKEN_COOKIE = "akhand.dev_init_token";
const REFRESH_BUFFER_SECONDS = 60;
let initialization = null;


function getCookie(name) {
    const prefix = `${encodeURIComponent(name)}=`;

    return document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(prefix))
        ?.slice(prefix.length) ?? null;
}

function tokenIsUsable(token) {
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        return Number(payload.exp) > (Date.now() / 1000) + REFRESH_BUFFER_SECONDS;
    } catch {
        return false;
    }
}

function saveToken(token) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${encodeURIComponent(TOKEN_COOKIE)}=${token}; Path=/; Max-Age=3540; SameSite=Lax${secure}`;
}

function clearToken() {
    document.cookie = `${encodeURIComponent(TOKEN_COOKIE)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

async function createToken(apiUrl) {
    const response = await fetch(`${apiUrl}/init`, { method: "POST" });
    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.ok || !body.token) {
        throw new Error(body?.message ?? "Could not initialize site data.");
    }

    saveToken(body.token);
    return body.token;
}

async function getToken(apiUrl) {
    const saved = getCookie(TOKEN_COOKIE);

    if (saved && tokenIsUsable(saved)) {
        return saved;
    }

    clearToken();
    return createToken(apiUrl);
}

async function request(apiUrl, path, token) {
    const response = await fetch(`${apiUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.ok) {
        const error = new Error(body?.message ?? `Could not load ${path}.`);
        error.status = response.status;
        throw error;
    }

    return body;
}

function unwrapRecord(response) {
    return response?.record?.data?.data ?? response?.data ?? [];
}

export async function initializeSite() {
    if (initialization) {
        return initialization;
    }

    initialization = (async () => {

        // setting status to be loading for the site
        site.put("bootstrap", { status: "loading", error: null });
        const runtime = site.get("runtime") ?? {};
        const apiUrl = String(runtime["api-url"]).replace(/\/$/, "");
        
        let token = await getToken(apiUrl);
        const load = async () => Object.fromEntries(
            await Promise.all(Object.entries(runtime["site-config"]).map(
                async ([key, path]) => [key, await request(apiUrl, path, token)]
            ))
        )

        // if error 401 throw else crete a new jwt token
        let results;
        try {
            results = await load();
        } catch (error) {
            if (error.status !== 401) throw error;
            clearToken();
            token = await createToken(apiUrl);
            results = await load();
        }

        for ({config_name, response} of results) {
            site.put(config_name, unwrapRecord(response));
        }
        site.put("bootstrap", { status: "ready", error: null });

    })().catch((error) => {
        site.put("bootstrap", {
            status: "error",
            error: error instanceof Error ? error.message : "Could not load live site data.",
        });
    });

    return initialization;
}
