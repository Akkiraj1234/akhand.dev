const REFRESH_BUFFER_SECONDS = 60;


function getCookie(name) {
    /*
    Return the decoded value of a cookie by name.

    Returns null when the cookie does not exist or its value cannot be
    decoded successfully.
    */
    const prefix = `${encodeURIComponent(name)}=`;
    const value = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(prefix))
        ?.slice(prefix.length);

    if (!value) return null;

    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
}

function tokenIsUsable(token) {
    /*
    Check whether a JWT contains a usable, non-expired expiration time.

    The token is considered unusable when its payload cannot be decoded,
    its expiration time is missing or invalid, or it expires within the
    configured refresh buffer.

    This only checks the JWT payload and expiration time. It does not
    verify the token's signature or authenticate its contents.
    */
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        return Number(payload.exp) > (Date.now() / 1000) + REFRESH_BUFFER_SECONDS;
    } catch {
        return false;
    }
}

function toLanguages(languages = []) {
    const validLanguages = Array.isArray(languages)
        ? languages.filter((language) => typeof language?.name === "string" && language.name)
        : [];
    const total = validLanguages.reduce(
        (sum, language) => sum + (Number(language.size) || 0),
        0
    );

    return Object.fromEntries(validLanguages.map((language) => [
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

function currently_formater(repositories) {
    /*
    `/github/activerepo` returns repository records with contribution totals.
    The Currently section expects a label and an array of display-ready
    projects, so keep that presentation shape at the service boundary.
    */
    return {
        label: "Currently building",
        projects: (Array.isArray(repositories) ? repositories : []).map(toProject),
    };
}

function featureRepo_formater(repositories) {
    /*
    `/database/github.pinnedrepo` returns the pinned repository records from
    the GitHub worker. They use the same repository fields as active projects,
    but have no contribution totals; `toProject()` safely supplies zeroes.
    */
    return {
        label: "Featured projects",
        projects: (Array.isArray(repositories) ? repositories : []).map(toProject),
    };
}

function heatmap_formater(payload) {
    /*
    `/gernal/heatmap` returns the latest normalized year for each provider as
    `{ year, data: { years: { [year]: heatmapSummary } } }`. Flatten the
    unnecessary `data` wrapper while retaining the provider and year, so a
    section can read `heatmap.github.years[heatmap.github.year]` consistently.
    */
    const providers = ["github", "leetcode", "roadmap"];

    return Object.fromEntries(providers.map((provider) => {
        const record = payload?.[provider];
        const year = typeof record?.year === "string" ? record.year : null;
        const years = record?.data?.years;

        return [provider, {
            year,
            years: years && typeof years === "object" && !Array.isArray(years)
                ? years
                : {},
        }];
    }));
}

export {
    currently_formater,
    featureRepo_formater,
    getCookie,
    heatmap_formater,
    tokenIsUsable,
    toProject,
};
