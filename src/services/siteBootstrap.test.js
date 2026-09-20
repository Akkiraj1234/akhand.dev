import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrap, request } from "./siteBootstrap";

const { siteMock, store } = vi.hoisted(() => {
    const store = new Map();

    return {
        store,
        siteMock: {
            get: vi.fn((key) => store.get(key)),
            put: vi.fn((key, value) => store.set(key, value)),
        },
    };
});

const { loadCachedData, startService } = vi.hoisted(() => ({
    loadCachedData: vi.fn(),
    startService: vi.fn(),
}));

const { getCookie, tokenIsUsable } = vi.hoisted(() => ({
    getCookie: vi.fn(),
    tokenIsUsable: vi.fn(),
}));

vi.mock("@/data/site", () => ({
    default: siteMock,
}));

vi.mock("@/services/dataServices", () => ({
    load_cached_data: loadCachedData,
    startService,
}));

vi.mock("@/services/utils", () => ({
    getCookie,
    tokenIsUsable,
}));

function response(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

beforeEach(() => {
    store.clear();
    vi.clearAllMocks();

    store.set("runtime", {
        "api-url": "https://api.example.com",
        "site-config": {
            currently: "/github/activerepo",
        },
    });

    getCookie.mockReturnValue("cached-token");
    tokenIsUsable.mockReturnValue(true);

    vi.stubGlobal("location", {
        protocol: "https:",
    });

    vi.stubGlobal("document", {
        cookie: "",
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("request", () => {
    it("adds authentication, query parameters, and JSON request bodies", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                response({
                    ok: true,
                    data: {
                        saved: true,
                    },
                }),
            ),
        );

        const result = await request("/profile", {
            method: "POST",
            headers: {
                "X-Test": "yes",
            },
            body: {
                name: "Akki",
            },
            query: {
                page: 2,
                empty: null,
            },
        });

        expect(result).toEqual({
            ok: true,
            data: {
                saved: true,
            },
        });

        const [url, options] = fetch.mock.calls[0];

        expect(url.toString()).toBe(
            "https://api.example.com/profile?page=2",
        );

        expect(options).toMatchObject({
            method: "POST",
            headers: {
                "X-Test": "yes",
                Authorization: "Bearer cached-token",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Akki",
            }),
        });
    });

    it("refreshes the token once after a 401 and retries the request", async () => {
        let token = "cached-token";

        getCookie.mockImplementation(() => token);

        const fetch = vi.fn()
            .mockResolvedValueOnce(
                response(
                    {
                        ok: false,
                        message: "Unauthorized",
                    },
                    401,
                ),
            )
            .mockImplementationOnce(async () => {
                token = "refreshed-token";

                return response({
                    ok: true,
                    token: "refreshed-token",
                });
            })
            .mockResolvedValueOnce(
                response({
                    ok: true,
                    data: {
                        value: 42,
                    },
                }),
            );

        vi.stubGlobal("fetch", fetch);

        const result = await request("/profile");

        expect(result).toEqual({
            ok: true,
            data: {
                value: 42,
            },
        });

        expect(fetch).toHaveBeenCalledTimes(3);

        expect(fetch.mock.calls[0][1].headers.Authorization)
            .toBe("Bearer cached-token");

        expect(fetch.mock.calls[2][1].headers.Authorization)
            .toBe("Bearer refreshed-token");
    });

    it("normalizes HTTP errors with the server message and status", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                response(
                    {
                        ok: false,
                        message: "Forbidden route",
                    },
                    403,
                ),
            ),
        );

        await expect(
            request("/private"),
        ).rejects.toMatchObject({
            message: "Forbidden route",
            status: 403,
        });
    });

    it("normalizes fetch failures when no HTTP response exists", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(
                new TypeError("Failed to fetch"),
            ),
        );

        await expect(
            request("/github/activerepo"),
        ).rejects.toMatchObject({
            message: "Failed to fetch",
            path: "/github/activerepo",
        });
    });
});

describe("bootstrap", () => {
    it("starts ready with new data when fresh service data is fetched", async () => {
        loadCachedData.mockResolvedValue(false);
        startService.mockResolvedValue(true);

        await bootstrap();

        expect(loadCachedData).toHaveBeenCalledTimes(1);
        expect(startService).toHaveBeenCalledTimes(1);

        expect(siteMock.get("runtime")).toMatchObject({
            "site-load-status": "ready",
            "site-data-status": "new",
            data: null,
        });
    });

    it("keeps the site ready but marks data as error when cached data exists and refresh fails", async () => {
        loadCachedData.mockResolvedValue(true);
        startService.mockResolvedValue(false);

        await bootstrap();

        expect(siteMock.get("runtime")).toMatchObject({
            "site-load-status": "ready",
            "site-data-status": "error",
            data: {
                message: "unable to fetch data",
            },
        });
    });

    it("shares one in-flight bootstrap operation across concurrent callers", async () => {
        loadCachedData.mockResolvedValue(false);

        let resolveStart;

        startService.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveStart = resolve;
                }),
        );

        const first = bootstrap();
        const second = bootstrap();

        expect(first).toBe(second);
        await Promise.resolve();
        expect(startService).toHaveBeenCalledTimes(1);

        resolveStart(true);

        await first;
    });
});