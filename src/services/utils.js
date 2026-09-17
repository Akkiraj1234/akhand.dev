function getCookie(name) {
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
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        return Number(payload.exp) > (Date.now() / 1000) + REFRESH_BUFFER_SECONDS;
    } catch {
        return false;
    }
}


export { getCookie, tokenIsUsable }