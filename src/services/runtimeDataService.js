import site from "@/data/site";









const CACHE_KEY = "akhand.dev:runtime-data";
let tokenRefreshInFlight = null;

function loadCachedData() {
    try {
        const saved = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");

        if (!Array.isArray(saved?.entries)) return false;

        for (const { key, value } of saved.entries) {
            site.put(key, value);
        }

        return saved.entries.some(({ key }) => key === "currently");
    } catch {
        return false;
    }
}

function load_cached_data() {
    const cookie = getCookie(CACHED_DATA);

    if (!cookie) return;

    try {
        const data = JSON.parse(cookie);

        for (const { key, data: value } of data.entries) {
            if (!value) continue;

            site.put(key, value);
        }
    } catch {
        return;
    }
}

function saveCachedData(entries) {
    try {
        const existing = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
        const merged = new Map(
            Array.isArray(existing?.entries)
                ? existing.entries.map(({ key, value }) => [key, value])
                : []
        );

        for (const { key, value } of entries) {
            merged.set(key, value);
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify({
            savedAt: new Date().toISOString(),
            entries: [...merged.entries()].map(([key, value]) => ({ key, value })),
        }));
    } catch {
        // Storage can be unavailable or full; fresh in-memory data still works.
    }
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
export async function startService({ request, saveCachedData }) {
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

    if (cachedEntries.length) saveCachedData(cachedEntries);

    return {
        activeRepos: activeRepos.status === "fulfilled"
            ? { ok: true }
            : { ok: false, error: activeRepos.reason },
        pinnedRepos: pinnedRepos.status === "fulfilled"
            ? { ok: true }
            : { ok: false, error: pinnedRepos.reason },
    };
}
