import Header from "./components/Header";
import Footer from "./components/Footer";
import "./MainLayout.css";


function MainLayout({ children }) {
    return (
        <div className="site-shell">
            <Header />
            {children}
            <Footer />
        </div>
    );
}

export default MainLayout;