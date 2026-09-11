import { getCookie } from "@/services/utils";
import site from "@/data/site";

const CACHE_KEY = "akhand.dev:runtime-data";
const CACHE_COOKIE_KEY = "akhand.dev_runtime_data";
const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
let refreshTimer = null;
let isServiceActive = false;

function getRefreshIntervalMs() {
    const runtime = site.get("runtime") ?? {};
    const interval = Number(
        runtime["refresh-interval"] ?? runtime.refreshInterval ?? runtime.interval
    );

    return Number.isFinite(interval) && interval > 0
        ? interval
        : DEFAULT_REFRESH_INTERVAL_MS;
}

function writeCacheCookie(data) {
    try {
        const secure = location.protocol === "https:" ? "; Secure" : "";
        const cookieValue = encodeURIComponent(JSON.stringify(data));

        document.cookie =
            `${encodeURIComponent(CACHE_COOKIE_KEY)}=${cookieValue}; ` +
            `Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
        // Cookie storage can fail in restricted environments.
    }
}

function loadCachedDataFromCookie() {
    const cookie = getCookie(CACHE_COOKIE_KEY);

    if (!cookie) return null;

    try {
        return JSON.parse(cookie);
    } catch {
        return null;
    }
}

function loadCachedDataFromStorage() {
    try {
        const saved = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");

        if (!Array.isArray(saved?.entries)) return null;

        return saved;
    } catch {
        return null;
    }
}

function load_cached_data() {
    const cachedValue = loadCachedDataFromCookie() ?? loadCachedDataFromStorage();

    if (!cachedValue?.entries) return false;

    for (const { key, value } of cachedValue.entries) {
        if (key && value !== undefined) {
            site.put(key, value);
        }
    }

    return cachedValue.entries.some(({ key }) => key === "currently");
}

function saveCachedData(entries = []) {
    const payload = {
        savedAt: new Date().toISOString(),
        entries,
    };

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
        // Storage can be unavailable or full; fresh in-memory data still works.
    }

    writeCacheCookie(payload);
}

function scheduleNextRefresh({ request, saveCachedDataFn = saveCachedData }) {
    if (!isServiceActive) return;

    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(() => {
        refreshTimer = null;

        if (!isServiceActive) return;

        startService({ request, saveCachedData: saveCachedDataFn });
    }, getRefreshIntervalMs());
}

function unwrap(response) {
    return response?.record?.data?.data ?? response?.data ?? [];
}

function toLanguages(languages = []) {
    const total = languages.reduce((sum, language) => sum + (Number(language?.size) || 0), 0);

    return Object.fromEntries(languages.map((language) => [
        language.name,
        total ? Math.round((Number(language.size) / total) * 100) : 0,
    ]));
}

function toProject(repository) {
    return {
        name: repository?.name ?? "Untitled project",
        description: repository?.description ?? "No description is available yet.",
        url: repository?.url ?? null,
        commits: repository?.totalCommits ?? 0,
        release_version: repository?.release?.tagName ?? null,
        topics: Array.isArray(repository?.topics) ? repository.topics : [],
        languages: toLanguages(repository?.languages),
        star: repository?.stars ?? 0,
        active_days: repository?.totalActiveDays ?? 0,
        started_at: repository?.createdAt?.slice(0, 10) ?? null,
        ended_at: null,
    };
}

// This service receives request(), not a JWT/header getter. It deliberately
// knows nothing about authentication, expiry, or retry rules.
export async function startService({ request, saveCachedData: saveCachedDataFn = saveCachedData }) {
    isServiceActive = true;

    const runtime = site.get("runtime") ?? {};
    const routes = runtime["site-config"] ?? {};
    const activePath = `/${routes.currently ?? "github/activerepo"}`;
    const pinnedPath = `/${routes["feature-repo"] ?? "database/github.pinnedrepo"}`;

    const [activeRepos, pinnedRepos] = await Promise.allSettled([
        request(activePath),
        request(pinnedPath),
    ]);
    const cachedEntries = [];

    if (activeRepos.status === "fulfilled") {
        const repositories = unwrap(activeRepos.value);
        const currently = {
            label: "Currently building",
            projects: (Array.isArray(repositories) ? repositories : []).map(toProject),
        };

        site.put("activeRepos", repositories);
        site.put("currently", currently);
        cachedEntries.push({ key: "activeRepos", value: repositories });
        cachedEntries.push({ key: "currently", value: currently });
    }

    if (pinnedRepos.status === "fulfilled") {
        const repositories = unwrap(pinnedRepos.value);
        site.put("pinnedRepos", repositories);
        cachedEntries.push({ key: "pinnedRepos", value: repositories });
    }

    if (cachedEntries.length) {
        saveCachedDataFn(cachedEntries);
    }

    scheduleNextRefresh({
        request,
        saveCachedDataFn,
    });

    return {
        activeRepos: activeRepos.status === "fulfilled"
            ? { ok: true }
            : { ok: false, error: activeRepos.reason },
        pinnedRepos: pinnedRepos.status === "fulfilled"
            ? { ok: true }
            : { ok: false, error: pinnedRepos.reason },
    };
}

export function stopService() {
    isServiceActive = false;

    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

export { load_cached_data, loadCachedDataFromCookie, loadCachedDataFromStorage, saveCachedData };
