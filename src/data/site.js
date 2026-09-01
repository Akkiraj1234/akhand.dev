import master from "./master.json";
import Store from "./store";

const store = new Store(master);

const site = {
    get(key) {
        return store.get(key);
    },

    put(key, value) {
        return store.put(key, value);
    },

    watch(key, listener) {
        return store.watch(key, listener);
    },
};


if (import.meta.env.DEV) {
    window.site = site;
}


export default site;