const DAY_MS = 24 * 60 * 60 * 1000;

export function toUtcDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function normalizeGithubEvents(events = []) {
    const counts = new Map();
    for (const event of Array.isArray(events) ? events : []) {
        const date = toUtcDate(event?.created_at);
        if (date) counts.set(date, (counts.get(date) ?? 0) + 1);
    }
    return [...counts].map(([date, count]) => ({ date, count }));
}

export function normalizeLeetcodeCalendar(calendar) {
    let raw = calendar;
    if (typeof raw === "string") {
        try { raw = JSON.parse(raw); } catch { return []; }
    }
    if (!raw || typeof raw !== "object") return [];
    return Object.entries(raw)
        .map(([timestamp, value]) => ({ date: toUtcDate(Number(timestamp) * 1000), count: Number(value) || 0 }))
        .filter(({ date, count }) => date && count > 0);
}

export function mergeActivity(sourceData = {}) {
    const days = new Map();
    for (const [source, entries] of Object.entries(sourceData)) {
        for (const { date, count } of entries ?? []) {
            if (!date || !Number.isFinite(count) || count <= 0) continue;
            const record = days.get(date) ?? { date, sources: {}, total: 0 };
            record.sources[source] = (record.sources[source] ?? 0) + count;
            record.total += count;
            days.set(date, record);
        }
    }
    return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function summarizeActivity(entries = []) {
    const activeDays = entries.filter((entry) => entry.total > 0).length;
    const total = entries.reduce((sum, entry) => sum + entry.total, 0);
    return { total, activeDays };
}

export function getIntensity(total, maximum) {
    if (!total || !maximum) return 0;
    return Math.min(4, Math.max(1, Math.ceil((total / maximum) * 4)));
}

export function buildCalendar(activity = [], weeksToShow = 26, now = new Date()) {
    const byDate = new Map(activity.map((item) => [item.date, item]));
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const start = new Date(today.getTime() - ((weeksToShow * 7 - 1) * DAY_MS));
    const maximum = Math.max(0, ...activity.map(({ total }) => total));
    return Array.from({ length: weeksToShow * 7 }, (_, index) => {
        const current = new Date(start.getTime() + index * DAY_MS);
        const date = current.toISOString().slice(0, 10);
        const entry = byDate.get(date);
        return { date, total: entry?.total ?? 0, sources: entry?.sources ?? {}, intensity: getIntensity(entry?.total ?? 0, maximum) };
    });
}

function readCache(storage, key, now) {
    try {
        const item = JSON.parse(storage?.getItem(key) ?? "null");
        return item?.data && item.expiresAt ? { data: item.data, stale: item.expiresAt <= now } : null;
    } catch { return null; }
}

function writeCache(storage, key, data, ttl, now) {
    try { storage?.setItem(key, JSON.stringify({ data, expiresAt: now + ttl })); } catch { /* cache is optional */ }
}

export async function fetchCached({ key, ttl, request, storage = globalThis.localStorage, now = Date.now() }) {
    const cached = readCache(storage, key, now);
    if (cached && !cached.stale) return { data: cached.data, cache: "fresh" };
    try {
        const data = await request();
        writeCache(storage, key, data, ttl, now);
        return { data, cache: "network" };
    } catch (error) {
        if (cached) return { data: cached.data, cache: "stale", error };
        throw error;
    }
}

async function requestJson(fetchFn, url, options) {
    const response = await fetchFn(url, options);
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
}

function getStoredToken(key) {
    try { return localStorage.getItem(key)?.replace(/^(Bearer|token)\s+/i, "").trim() || ""; } catch { return ""; }
}

async function fetchGithubContributionCalendar({ username, token, fetchFn }) {
    if (!token) return null;
    const to = new Date();
    const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));
    const query = `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
    const payload = await requestJson(fetchFn, "https://api.github.com/graphql", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query, variables: { login: username, from: from.toISOString(), to: to.toISOString() } })
    });
    if (payload?.errors?.length) throw new Error(payload.errors[0].message || "GitHub GraphQL failed");
    const calendar = payload?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) throw new Error("GitHub contribution calendar was unavailable");
    return { activity: calendar.weeks.flatMap((week) => week.contributionDays.map((day) => ({ date: day.date, count: Number(day.contributionCount) || 0 }))), totalContributions: calendar.totalContributions };
}

export async function fetchGithubActivity({ username, ttl, fetchFn = fetch, storage, tokenStorageKey = "GITHUB_TOKEN" }) {
    return fetchCached({
        key: `akhand.dev:github:${username}`, ttl, storage,
        request: async () => {
            const base = `https://api.github.com/users/${encodeURIComponent(username)}`;
            const [profile, repositories, events, calendar] = await Promise.all([
                requestJson(fetchFn, base), requestJson(fetchFn, `${base}/repos?sort=updated&per_page=6`), requestJson(fetchFn, `${base}/events/public?per_page=100`)
                , fetchGithubContributionCalendar({ username, token: getStoredToken(tokenStorageKey), fetchFn }).catch(() => null)
            ]);
            const activity = calendar?.activity ?? normalizeGithubEvents(events);
            return { profile, repositories, activity, summary: { total: calendar?.totalContributions ?? activity.reduce((sum, entry) => sum + entry.count, 0), mode: calendar ? "contributions" : "public events" } };
        }
    });
}

export async function fetchLeetcodeActivity({ username, ttl, fetchFn = fetch, storage, year = null, proxyUrl = "" }) {
    const query = `query userProfileCalendar($username: String!, $year: Int) { matchedUser(username: $username) { userCalendar(year: $year) { activeYears streak totalActiveDays submissionCalendar } } }`;
    return fetchCached({
        key: `akhand.dev:leetcode:${username}:${year}`, ttl, storage,
        request: async () => {
            const endpoint = proxyUrl ? `${proxyUrl.replace(/\/$/, "")}/leetcode` : "https://leetcode.com/graphql";
            const payload = await requestJson(fetchFn, endpoint, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables: { username, year } })
            });
            if (payload?.errors?.length) throw new Error(payload.errors[0].message || "LeetCode GraphQL failed");
            const userCalendar = payload?.data?.matchedUser?.userCalendar;
            const calendar = userCalendar?.submissionCalendar;
            if (!calendar) throw new Error("LeetCode calendar was unavailable");
            const activity = normalizeLeetcodeCalendar(calendar);
            return { activity, summary: { total: activity.reduce((sum, entry) => sum + entry.count, 0), activeDays: userCalendar.totalActiveDays || 0, streak: userCalendar.streak || 0 } };
        }
    });
}

export async function loadActivity({ profiles, settings, fetchFn, storage } = {}) {
    const jobs = [];
    if (profiles?.github?.enabled && settings?.enabledSources?.includes("github")) jobs.push(["github", fetchGithubActivity({ username: profiles.github.username, ttl: settings.githubTtlMs, fetchFn, storage, tokenStorageKey: settings.githubTokenStorageKey })]);
    if (profiles?.leetcode?.enabled && settings?.enabledSources?.includes("leetcode")) jobs.push(["leetcode", fetchLeetcodeActivity({ username: profiles.leetcode.username, ttl: settings.leetcodeTtlMs, fetchFn, storage, proxyUrl: settings.proxyUrl })]);
    const results = await Promise.allSettled(jobs.map(([, job]) => job));
    const sources = {}; const details = {}; const errors = {};
    results.forEach((result, index) => {
        const source = jobs[index][0];
        if (result.status === "fulfilled") { sources[source] = result.value.data.activity; details[source] = result.value.data; }
        else errors[source] = result.reason;
    });
    return { activity: mergeActivity(sources), details, errors };
}
