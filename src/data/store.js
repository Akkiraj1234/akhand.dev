class Store {
    #data;
    #listeners;

    constructor(initialState = {}) {
        this.#data = structuredClone(initialState);
        this.#listeners = new Map();
    }

    get(key) {
        return structuredClone(this.#data[key]);
    }

    put(key, value) {
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