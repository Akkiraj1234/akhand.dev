import site from "../data/site";
import { useEffect, useRef, useState } from "preact/hooks";

const navItems = [
    ["Home", "#home"],
    ["Projects", "#projects"],
    ["Blog", "#blog"],
    ["About", "#about"],
];


function MoreMenu({ onMouseInside }) {
    const profiles = Object.values(site.profiles).filter(
        (profile) => profile.enabled && profile.url
    );

    const contacts = Object.entries(site.social).filter(
        ([, value]) => value
    );

    const menuRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (event) => {
            const menu = menuRef.current;
            const panel = panelRef.current;

            if (!menu?.open || !panel) {
                onMouseInside(false);
                return;
            }

            const panelRect = panel.getBoundingClientRect();
            const summaryRect = menu
                .querySelector("summary")
                .getBoundingClientRect();

            const padding = 20;

            const inside =
                (
                    event.clientX >= panelRect.left - padding &&
                    event.clientX <= panelRect.right + padding &&
                    event.clientY >= panelRect.top - padding &&
                    event.clientY <= panelRect.bottom + padding
                ) ||
                (
                    event.clientX >= summaryRect.left - padding &&
                    event.clientX <= summaryRect.right + padding &&
                    event.clientY >= summaryRect.top - padding &&
                    event.clientY <= summaryRect.bottom + padding
                );
            
            if (!inside) {
                menu.removeAttribute("open");
            }
            onMouseInside(inside);
        };

        document.addEventListener("mousemove", handleMouseMove);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <details ref={menuRef} className="more-menu">
            <summary>More</summary>
            <div ref={panelRef} className="more-menu-panel">
                {profiles.map((profile) => (
                    <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={profile.label}
                    >
                        {profile.label} ↗
                    </a>
                ))}

                {contacts.map(([name, value]) => {
                    const isEmail = name === "email";
                    return (
                        <a
                            href={isEmail ? `mailto:${value}` : value}
                            target={isEmail ? undefined : "_blank"}
                            rel={isEmail ? undefined : "noopener noreferrer"}
                            key={name}
                        >
                            {name} {!isEmail && " ↗"}
                        </a>
                    );
                })}

                {!contacts.length && !profiles.length && (
                    <span className="muted-menu-item">
                        Contact coming soon
                    </span>
                )}
            </div>
        </details>
    );
}

function Header({ toggleTheme, theme, headerVisible, onMenuMouseInside }) {
    const site_data = site.site;

    return (
        <header className = {`site-header ${headerVisible ? "" : "hidden"}`}>
            <a className="wordmark" href="#home" aria-label={`${site_data.name} home`}>
                <img
                    src={
                        theme === "dark"
                            ? "/transparent_logo_dark.svg"
                            : "/transparent_logo_light.svg"
                    }
                    alt={`${site_data.name} logo`}
                />
            </a>

            <nav aria-label="Primary navigation">
                {navItems.map(([label, href]) => (
                    <a href={href} key={href}>{ label }</a>
                ))}
                
                <MoreMenu onMouseInside={onMenuMouseInside} />
                
                <button 
                    className="theme-toggle" 
                    type="button" 
                    onClick={toggleTheme} 
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    title="Toggle color mode"
                >
                    <img
                        src={
                            theme === "dark"
                                ? "https://api.iconify.design/akar-icons:sun.svg?color=%23b9e958"
                                : "https://api.iconify.design/akar-icons:moon.svg?color=%23466B19"
                        }
                        alt=""
                        aria-hidden="true"
                    />
                </button>
            </nav>
        </header>
    )
}

function Footer() {
    const site_data = site.site;
    return (
        <footer className="site-footer">
            <div className="footer-identity">
                <strong>{site_data.fullName}</strong>
                <span>{site_data.title}</span>
            </div>

            <nav className="footer-links">
                <a href={site_data.github}>
                    <img src="https://api.iconify.design/bi:github.svg" alt=""/>
                    Source code
                </a>
            </nav>

            <div className="footer-meta">
                <span>© {new Date().getFullYear()} {site_data.fullName}</span>
                <span>Made with care and love. Built to be useful.</span>
            </div>
        </footer>
    )
}

function getInitialTheme() {
    if (typeof window === "undefined") {
        return "dark";
    }

    const saved = localStorage.getItem("akhand.dev:theme");

    if (saved === "light" || saved === "dark") {
        return saved;
    }

    return "dark";
}

function MainLayout({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [menuActive, setMenuActive] = useState(false);
    
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("akhand.dev:theme", theme);
    }, [theme]);

    useEffect(() => {
        let lastScrollY = window.scrollY;
        let lastMouseY = window.innerHeight;

        const handleMouseMove = (event) => {
            const currentMouseY = event.clientY;
            const movingDown = currentMouseY > lastMouseY;

            if (currentMouseY < 75 || menuActive) {
                setHeaderVisible(true);
            } else if (
                window.scrollY >= 72 &&
                movingDown
            ) {
                setHeaderVisible(false);
            }

            lastMouseY = currentMouseY;
        };

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY;

            if (currentScrollY < 72 || menuActive) {
                setHeaderVisible(true);
                lastScrollY = currentScrollY;
                return;
            }

            if (delta > 10) {
                setHeaderVisible(false);
                lastScrollY = currentScrollY;
            } else if (delta < -10) {
                setHeaderVisible(true);
                lastScrollY = currentScrollY;
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("scroll", handleScroll);
        };
    }, [menuActive]);

    const toggleTheme = () => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    };

    return (
        <div className="site-shell">
            <Header
                toggleTheme={toggleTheme}
                theme={theme}
                headerVisible={headerVisible}
                onMenuMouseInside={setMenuActive}
            />
            {children}
            <Footer/>
        </div>
    );
}

export {
    MainLayout,
};