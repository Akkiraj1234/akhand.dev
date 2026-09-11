import Home from "@/pages/Home/Home";
import { useEffect } from "preact/hooks";
import { bootstrap } from "@/services/siteBootstrap";

export default function App() {
    useEffect(() => {
        bootstrap();
    }, []);

    return <Home />;
}
