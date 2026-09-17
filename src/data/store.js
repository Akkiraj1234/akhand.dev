class Store {
    /*
    In-memory reactive store for application state.

    The store keeps its internal state private and exposes values through
    cloned copies. This prevents callers from modifying the stored state
    without using put().

    Values written to the store are also cloned before being stored, so
    subsequent changes to the original value do not affect the store.

    Listeners can subscribe to individual keys through watch(). Whenever a
    value is updated with put(), all listeners registered for that key are
    called with a cloned copy of the new value.

    Listener failures do not prevent other listeners from being called.
    If one or more listeners throw, their errors are collected and reported
    together as an AggregateError after all listeners have been executed.
    */
    #data;
    #listeners;

    constructor(initialState = {}) {
        /*
        Create a store initialized with a clone of the provided state.

        The initial state is cloned so the caller cannot mutate the store
        through the original object.
        */
        this.#data = structuredClone(initialState);
        this.#listeners = new Map();
    }

    get(key) {
        /*
        Return a cloned copy of the value stored under the given key.

        Returns undefined when the key does not exist.
        */
        return structuredClone(this.#data[key]);
    }

    put(key, value) {
        /*
        Replace the value stored under the given key.

        The value is cloned before being stored and before being delivered
        to listeners.

        All listeners registered for the key are notified after the value
        is updated. Every listener is given an independent clone of the
        new value.

        If one or more listeners fail, all listeners are still executed.
        Their errors are collected and thrown together as an AggregateError.

        Returns true when the value has been stored successfully.
        */
        const nextValue = structuredClone(value);
        this.#data[key] = nextValue;
        const subscribers = this.#listeners.get(key);

        if (!subscribers) {
            return true;
        }

        const errors = [];

        for (const listener of subscribers) {
            try {
                listener(structuredClone(nextValue));
            } catch (error) {
                errors.push(error);
            }
        }

        if (errors.length) {
            throw new AggregateError(
                errors,
                `One or more listeners failed for key "${String(key)}"`
            );
        }

        return true;
    }

    watch(key, listener) {
        /*
        Subscribe a listener to changes for the given key.

        The listener is called whenever put() updates the key and receives
        a cloned copy of the new value.

        Returns an unsubscribe function that removes the listener.
        */
        if (typeof listener !== "function") {
            throw new TypeError(
                "listener must be a function"
            );
        }

        let subscribers = this.#listeners.get(key);

        if (!subscribers) {
            subscribers = new Set();
            this.#listeners.set(key, subscribers);
        }

        subscribers.add(listener);

        return () => {
            subscribers.delete(listener);

            if (!subscribers.size) {
                this.#listeners.delete(key);
            }
        };
    }
}

export default Store;