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

export { getCookie, tokenIsUsable, toProject }
