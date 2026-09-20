import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startService, stopService } from "./dataServices";

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

vi.mock("@/data/site", () => ({
    default: siteMock,
}));

function setRuntime(routes, extra = {}) {
    siteMock.put("runtime", {
        "site-config": routes,
        ...extra,
    });
}

function stubCacheStorage() {
    const values = new Map();

    vi.stubGlobal("localStorage", {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
    });

    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("location", { protocol: "https:" });

    return values;
}

describe("data service", () => {
    beforeEach(() => {
        store.clear();
        vi.clearAllMocks();
        vi.useFakeTimers();
        stubCacheStorage();
    });

    afterEach(() => {
        stopService();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("fetches configured routes and stores formatted data as new", async () => {
        setRuntime({
            currently: "/github/activerepo",
        });

        const request = vi.fn().mockResolvedValue({
            ok: true,
            data: [
                {
                    name: "portfolio",
                    description: "Personal site",
                    url: "https://example.com/portfolio",
                    stars: 3,
                    topics: ["preact"],
                    languages: [{ name: "JavaScript", size: 10 }],
                    totalCommits: 12,
                    totalActiveDays: 4,
                    createdAt: "2026-01-15T00:00:00Z",
                },
            ],
        });

        await expect(startService({ request })).resolves.toBe(true);

        expect(request).toHaveBeenCalledWith("/github/activerepo");

        expect(siteMock.get("currently")).toMatchObject({
            "site-load-status": "ready",
            "site-data-status": "new",
            data: {
                label: "Currently building",
                projects: [
                    expect.objectContaining({
                        name: "portfolio",
                        commits: 12,
                        active_days: 4,
                    }),
                ],
            },
        });
    });

    it("preserves existing data and marks refresh failure as ready + error", async () => {
        setRuntime({
            currently: "/github/activerepo",
        });

        const cached = {
            label: "Currently building",
            projects: [{ name: "cached-project" }],
        };

        siteMock.put("currently", {
            "site-load-status": "ready",
            "site-data-status": "old",
            data: cached,
        });

        const request = vi.fn().mockRejectedValue(
            new Error("Network failed"),
        );

        await expect(startService({ request })).resolves.toBe(false);

        expect(siteMock.get("currently")).toMatchObject({
            "site-load-status": "ready",
            "site-data-status": "error",
            data: cached,
        });
    });

    it("stores the request error when no usable data exists", async () => {
        setRuntime({
            heatmap: "/gernal/heatmap",
        });

        const error = new Error("CORS request failed");
        const request = vi.fn().mockRejectedValue(error);

        await expect(startService({ request })).resolves.toBe(false);

        const value = siteMock.get("heatmap");

        expect(value["site-load-status"]).toBe("error");
        expect(value["site-data-status"]).toBe("error");
        expect(value.data).toBe(error);
    });

    it("retries failed routes once and uses the fresh result when the retry succeeds", async () => {
        setRuntime({
            currently: "/github/activerepo",
        });

        const request = vi
            .fn()
            .mockRejectedValueOnce(new Error("temporary failure"))
            .mockResolvedValueOnce({
                ok: true,
                data: [],
            });

        const promise = startService({ request });

        await vi.advanceTimersByTimeAsync(1000);

        await expect(promise).resolves.toBe(true);

        expect(request).toHaveBeenCalledTimes(2);

        expect(siteMock.get("currently")).toMatchObject({
            "site-load-status": "ready",
            "site-data-status": "new",
        });
    });

    it("persists only ready route data and not failed routes", async () => {
        setRuntime({
            currently: "/github/activerepo",
            heatmap: "/gernal/heatmap",
        });

        const request = vi.fn(async (path) => {
            if (path === "/gernal/heatmap") {
                throw new Error("heatmap unavailable");
            }

            return {
                ok: true,
                data: [],
            };
        });

        const values = stubCacheStorage();

        const promise = startService({ request });

        await vi.advanceTimersByTimeAsync(1000);
        await expect(promise).resolves.toBe(true);

        const payload = JSON.parse(
            values.get("akhand.dev:runtime-data"),
        );

        expect(payload.entries).toEqual([
            expect.objectContaining({
                key: "currently",
                value: expect.objectContaining({
                    "site-load-status": "ready",
                    "site-data-status": "new",
                }),
            }),
        ]);
    });

    it("stops scheduled refreshes", async () => {
        setRuntime({
            currently: "/github/activerepo",
        });

        const request = vi.fn().mockResolvedValue({
            ok: true,
            data: [],
        });

        await startService({ request });

        stopService();

        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

        expect(request).toHaveBeenCalledTimes(1);
    });
});