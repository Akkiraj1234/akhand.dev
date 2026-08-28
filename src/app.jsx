import Home from "./pages/Home";
import site from "./data/site";

export default function App() {
    document.title = `${site.site.fullName} — ${site.site.title}`;
    return <Home />;
}
