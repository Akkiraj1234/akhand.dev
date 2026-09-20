import { describe, expect, it, vi } from "vitest";
import Store from "./store";

describe("Store", () => {
    it("initializes with a cloned copy of the initial state", () => {
        const initialState = {
            user: {
                name: "Akki",
            },
        };

        const store = new Store(initialState);

        initialState.user.name = "Changed";

        expect(store.get("user")).toEqual({
            name: "Akki",
        });
    });

    it("returns undefined for an unknown key", () => {
        const store = new Store();

        expect(store.get("missing")).toBeUndefined();
    });

    it("stores and returns values with put and get", () => {
        const store = new Store();

        expect(
            store.put("runtime", {
                ready: true,
            }),
        ).toBe(true);

        expect(store.get("runtime")).toEqual({
            ready: true,
        });
    });

    it("clones values before storing them", () => {
        const store = new Store();

        const value = {
            nested: {
                count: 1,
            },
        };

        store.put("data", value);

        value.nested.count = 99;

        expect(store.get("data")).toEqual({
            nested: {
                count: 1,
            },
        });
    });

    it("clones values returned by get", () => {
        const store = new Store();

        store.put("data", {
            nested: {
                count: 1,
            },
        });

        const value = store.get("data");
        value.nested.count = 99;

        expect(store.get("data")).toEqual({
            nested: {
                count: 1,
            },
        });
    });

    it("notifies watchers when a value is updated", () => {
        const store = new Store();
        const listener = vi.fn();

        store.watch("runtime", listener);

        store.put("runtime", {
            ready: true,
        });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
            ready: true,
        });
    });

    it("passes an independent clone to each watcher", () => {
        const store = new Store();

        let firstValue;
        let secondValue;

        store.watch("runtime", (value) => {
            firstValue = value;
            firstValue.nested.count = 10;
        });

        store.watch("runtime", (value) => {
            secondValue = value;
        });

        store.put("runtime", {
            nested: {
                count: 1,
            },
        });

        expect(firstValue).toEqual({
            nested: {
                count: 10,
            },
        });

        expect(secondValue).toEqual({
            nested: {
                count: 1,
            },
        });

        expect(store.get("runtime")).toEqual({
            nested: {
                count: 1,
            },
        });
    });

    it("returns an unsubscribe function from watch", () => {
        const store = new Store();
        const listener = vi.fn();

        const unsubscribe = store.watch("runtime", listener);

        store.put("runtime", { count: 1 });

        unsubscribe();

        store.put("runtime", { count: 2 });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenLastCalledWith({
            count: 1,
        });
    });

    it("rejects non-function listeners", () => {
        const store = new Store();

        expect(() => {
            store.watch("runtime", null);
        }).toThrow(TypeError);

        expect(() => {
            store.watch("runtime", "listener");
        }).toThrow(TypeError);
    });

    it("continues notifying other watchers when one watcher fails", () => {
        const store = new Store();

        const failingListener = vi.fn(() => {
            throw new Error("listener failed");
        });

        const workingListener = vi.fn();

        store.watch("runtime", failingListener);
        store.watch("runtime", workingListener);

        expect(() => {
            store.put("runtime", {
                ready: true,
            });
        }).toThrow(AggregateError);

        expect(failingListener).toHaveBeenCalledTimes(1);
        expect(workingListener).toHaveBeenCalledTimes(1);
    });

    it("collects listener failures into an AggregateError", () => {
        const store = new Store();

        const firstError = new Error("first");
        const secondError = new Error("second");

        store.watch("runtime", () => {
            throw firstError;
        });

        store.watch("runtime", () => {
            throw secondError;
        });

        try {
            store.put("runtime", {
                ready: true,
            });

            throw new Error("Expected put() to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(AggregateError);
            expect(error.errors).toEqual([
                firstError,
                secondError,
            ]);
        }
    });

    it("removes the listener set when the last watcher unsubscribes", () => {
        const store = new Store();
        const listener = vi.fn();

        const unsubscribe = store.watch("runtime", listener);

        unsubscribe();

        store.put("runtime", {
            ready: true,
        });

        expect(listener).not.toHaveBeenCalled();
    });

    it("stores values even when there are no watchers", () => {
        const store = new Store();

        expect(
            store.put("runtime", {
                ready: true,
            }),
        ).toBe(true);

        expect(store.get("runtime")).toEqual({
            ready: true,
        });
    });
});