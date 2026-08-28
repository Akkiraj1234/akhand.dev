import { describe, expect, it, vi } from "vitest";
import { fetchCached, getIntensity, mergeActivity, normalizeGithubEvents, normalizeLeetcodeCalendar } from "./activity";

function storage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

describe("activity normalization", () => {
    it("groups valid GitHub events by UTC day and ignores malformed events", () => {
        expect(normalizeGithubEvents([{ created_at: "2026-08-29T01:00:00Z" }, { created_at: "2026-08-29T23:00:00Z" }, {}])).toEqual([{ date: "2026-08-29", count: 2 }]);
    });

    it("parses LeetCode calendars and rejects malformed data", () => {
        expect(normalizeLeetcodeCalendar('{"1787961600":3,"1788048000":0}')).toEqual([{ date: "2026-08-29", count: 3 }]);
        expect(normalizeLeetcodeCalendar("not json")).toEqual([]);
    });

    it("merges sources without losing their individual counts", () => {
        expect(mergeActivity({ github: [{ date: "2026-08-29", count: 4 }], leetcode: [{ date: "2026-08-29", count: 2 }] })).toEqual([{ date: "2026-08-29", sources: { github: 4, leetcode: 2 }, total: 6 }]);
        expect(getIntensity(3, 8)).toBe(2);
    });
});

describe("client cache", () => {
    it("returns an unexpired item without running the request", async () => {
        const request = vi.fn();
        const cache = storage({ item: JSON.stringify({ data: { value: 1 }, expiresAt: 200 }) });
        await expect(fetchCached({ key: "item", ttl: 50, request, storage: cache, now: 100 })).resolves.toEqual({ data: { value: 1 }, cache: "fresh" });
        expect(request).not.toHaveBeenCalled();
    });

    it("uses stale cached data if a refresh fails", async () => {
        const cache = storage({ item: JSON.stringify({ data: { value: 1 }, expiresAt: 10 }) });
        const request = vi.fn().mockRejectedValue(new Error("offline"));
        const result = await fetchCached({ key: "item", ttl: 50, request, storage: cache, now: 100 });
        expect(result.data).toEqual({ value: 1 });
        expect(result.cache).toBe("stale");
        expect(result.error).toBeInstanceOf(Error);
    });
});
