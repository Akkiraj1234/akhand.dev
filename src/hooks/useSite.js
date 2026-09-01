import { useEffect, useState } from "preact/hooks";
import site from "../data/site";


function useSite(key) {
    const [value, setValue] = useState(() => site.get(key));
    
    useEffect(() => {
        return site.watch(key, setValue);
    }, [key]);

    return value;
}


export default useSite;