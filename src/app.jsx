import Home from "@/pages/Home/Home";
import { useEffect } from "preact/hooks";
import { initializeSite } from "@/services/siteBootstrap";

export default function App() {
    useEffect(() => {
        initializeSite();
    }, []);

    return <Home />;
}
