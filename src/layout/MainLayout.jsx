import site from "../data/site";
import { useEffect, useState } from "preact/hooks";

const navItems = [
    ["Home", "#home"],
    ["Projects", "#projects"],
    ["Blog", "#blog"],
    ["About", "#about"],
];

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

export default function MainLayout({ children }) {
    const profiles = Object.values(site.profiles).filter(
        (profile) => profile.enabled && profile.url
    );

    const contacts = Object.entries(site.social).filter(
        ([, value]) => value
    );

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("akhand.dev:theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    };

    const more_menu = (
        <details className="more-menu">
            <summary>More</summary>
            <div className="more-menu-panel">
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
                            href = {isEmail ? `mailto:${value}`: value }
                            target = {isEmail ? undefined : "_blank"}
                            rel = {isEmail ? undefined : "noopener noreferrer"}
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
    )

    const header = (
        <header className = "site-header">
            <a className="wordmark" href="#home" aria-label={`${site.site.name} home`}>
                <img src="/favicon.svg" alt={`${site.site.name} logo`} className="site-logo" />
            </a>
            <nav aria-label="Primary navigation">
                {navItems.map(([label, href]) => (
                    <a href={href} key={href}>{ label }</a>
                ))}

                <button 
                    className="theme-toggle" 
                    type="button" 
                    onClick={toggleTheme} 
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    title="Toggle color mode"
                >
                    {theme === "dark" ? (
                        /* show sun icon when switching to light */
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="4"></circle>
                            <path d="M12 2v2"></path>
                            <path d="M12 20v2"></path>
                            <path d="M4.93 4.93l1.41 1.41"></path>
                            <path d="M17.66 17.66l1.41 1.41"></path>
                            <path d="M2 12h2"></path>
                            <path d="M20 12h2"></path>
                            <path d="M4.93 19.07l1.41-1.41"></path>
                            <path d="M17.66 6.34l1.41-1.41"></path>
                        </svg>
                    ) : (
                        /* show moon icon when switching to dark */
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
                        </svg>
                    )}
                </button>

                {more_menu}
            </nav>
        </header>
    )

    const footer = (
        <footer className="site-footer">
            <span>
                © {new Date().getFullYear()} {site.site.fullName}
            </span>

            {/* <span>
                GitHub: {value.site.GitHub}
            </span> */}

            <span>
                Built with care, curiosity and plain old HTML.
            </span>
        </footer>
    )

    return (
        <div className="site-shell">
            {header}
            {children}
            {footer}
        </div>
    );
}