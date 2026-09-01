import { useEffect, useRef, useState } from "preact/hooks";
import useSite from "../hooks/usesite"


const navItems = [
    ["Home", "#home"],
    ["Projects", "#projects"],
    ["Blog", "#blog"],
    ["About", "#about"],
];



function isInsideRect(event, rect, padding = 20) {
    return (
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding
    );
}

function useMenuBoundary( menuRef, panelRef, onMouseInside ) {
    const padding = 20;

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
            
            if (
                isInsideRect(event, panelRect) ||
                isInsideRect(event, summaryRect)
            ) {
                onMouseInside(inside);
                return;
            }
            menu.removeAttribute("open");
        };
        
        document.addEventListener("mousemove", handleMouseMove);
        
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);
}

function MoreMenuPanel({ panelRef }) {
    const profiles = Object.values(useSite("profiles")).filter(
        (profile) => profile.enabled && profile.url
    );

    const contacts = Object.entries(useSite("social")).filter(
        ([, value]) => value
    );

    return (
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
    );
}


function MoreMenu({ onMouseInside }) {
    // data fatch for profile and contacts
    // happen in MoreMenuPanel

    const menuRef = useRef(null);
    const panelRef = useRef(null);

    useMenuBoundary(menuRef, panelRef, onMouseInside);

    return (
        <details ref={menuRef} className="more-menu">
            <summary>More</summary>
            <MoreMenuPanel
                panelRef={panelRef}
            />
        </details>
    );
}




























function Header({ toggleTheme, theme, headerVisible, onMenuMouseInside }) {
    const sitedata = useSite("site");

    console.log("HEADER: i re run again")

    return (
        <header className = {`site-header ${headerVisible ? "" : "hidden"}`}>
            <a className="wordmark" href="#home" aria-label={`${sitedata.name} home`}>
                <img
                    src={
                        theme === "dark"
                            ? "/transparent_logo_dark.svg"
                            : "/transparent_logo_light.svg"
                    }
                    alt={`${sitedata.name} logo`}
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
    console.log("FOOTER: i re run again")
    const sitedata = useSite("site");
    return (
        <footer className="site-footer">
            <div className="footer-identity">
                <strong>{sitedata.fullName}</strong>
                <span>{sitedata.title}</span>
            </div>

            <nav className="footer-links">
                <a href={sitedata.github}>
                    <img src="https://api.iconify.design/bi:github.svg" alt=""/>
                    Source code
                </a>
            </nav>

            <div className="footer-meta">
                <span>© {new Date().getFullYear()} {sitedata.fullName}</span>
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