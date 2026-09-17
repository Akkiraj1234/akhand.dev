import { useEffect, useState } from "preact/hooks";
import site from "@/data/site";


function useSite(key) {
    /*
    Subscribe to a site state value and keep the component synchronized
    with changes to that value.

    The current value is read from the site store when the hook initializes.
    The component is then subscribed to changes for the given key and will
    re-render whenever the value is updated.

    The subscription is recreated when the key changes and automatically
    removed when the component unmounts.
    */
    const [value, setValue] = useState(() => site.get(key));
    
    useEffect(() => {
        return site.watch(key, setValue);
    }, [key]);

    return value;
}


export default useSite;