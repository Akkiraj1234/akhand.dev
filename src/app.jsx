import Home from "@/pages/Home/Home";
import { useEffect } from "preact/hooks";
import { bootstrap } from "@/services/siteBootstrap";
import { stopService } from "@/services/runtimeDataService";

export default function App() {
    useEffect(() => {
        bootstrap();

        return () => {
            stopService();
        };
    }, []);
    
    return <Home />;
}
