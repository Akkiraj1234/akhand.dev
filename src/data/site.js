import master from "./master.json";
import Store from "./store";

const store = new Store(master);

const site = {
    /*
    Return the current value stored under the given key.
    */
    get(key) {
        return store.get(key);
    },

    /*
    Store a value under the given key and notify registered watchers.
    */
    put(key, value) {
        return store.put(key, value);
    },

    /*
    Subscribe to changes for a specific key.

    Returns the subscription handle provided by the underlying store.
    */
    watch(key, listener) {
        return store.watch(key, listener);
    },
};


export default site;