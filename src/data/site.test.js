import { afterEach, describe, expect, it, vi } from "vitest";
import site from "./site";

describe("site", () => {
    const keys = [];

    afterEach(() => {
        keys.length = 0;
    });

    it("returns undefined for a missing key", () => {
        const key = `test-missing-${crypto.randomUUID()}`;
        keys.push(key);

        expect(site.get(key)).toBeUndefined();
    });

    it("stores and returns values through put and get", () => {
        const key = `test-put-get-${crypto.randomUUID()}`;
        keys.push(key);

        const value = {
            name: "Akki",
            nested: {
                ready: true,
            },
        };

        expect(site.put(key, value)).toBe(true);
        expect(site.get(key)).toEqual(value);
    });

    it("returns cloned values instead of exposing stored state", () => {
        const key = `test-clone-${crypto.randomUUID()}`;
        keys.push(key);

        site.put(key, {
            user: {
                name: "Akki",
            },
        });

        const value = site.get(key);
        value.user.name = "Changed";

        expect(site.get(key)).toEqual({
            user: {
                name: "Akki",
            },
        });
    });

    it("notifies watchers when a value changes", () => {
        const key = `test-watch-${crypto.randomUUID()}`;
        keys.push(key);

        const listener = vi.fn();
        const unsubscribe = site.watch(key, listener);

        site.put(key, {
            ready: true,
        });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
            ready: true,
        });

        unsubscribe();
    });

    it("stops notifying a watcher after unsubscribe", () => {
        const key = `test-unsubscribe-${crypto.randomUUID()}`;
        keys.push(key);

        const listener = vi.fn();
        const unsubscribe = site.watch(key, listener);

        site.put(key, {
            count: 1,
        });

        unsubscribe();

        site.put(key, {
            count: 2,
        });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenLastCalledWith({
            count: 1,
        });
    });

    it("does not expose the value received by a watcher", () => {
        const key = `test-watcher-clone-${crypto.randomUUID()}`;
        keys.push(key);

        let received;

        site.watch(key, (value) => {
            received = value;
            received.nested.ready = false;
        });

        site.put(key, {
            nested: {
                ready: true,
            },
        });

        expect(received).toEqual({
            nested: {
                ready: false,
            },
        });

        expect(site.get(key)).toEqual({
            nested: {
                ready: true,
            },
        });
    });
});