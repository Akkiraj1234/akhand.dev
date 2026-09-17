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


export { getCookie, tokenIsUsable }