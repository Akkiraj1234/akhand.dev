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

    return (
        <div className="site-shell">
            <header className="site-header">
                <a
                    className="wordmark"
                    href="#home"
                    aria-label={`${site.site.name} home`}
                >
                    {site.site.name}
                    <span aria-hidden="true">.</span>
                </a>

                <nav aria-label="Primary navigation">
                    {navItems.map(([label, href]) => (
                        <a href={href} key={href}>
                            {label}
                        </a>
                    ))}

                    <button
                        className="theme-toggle"
                        type="button"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${
                            theme === "dark" ? "light" : "dark"
                        } mode`}
                        title="Toggle color mode"
                    >
                        <span aria-hidden="true">
                            {theme === "dark" ? "☼" : "☾"}
                        </span>
                    </button>

                    <details className="more-menu">
                        <summary>
                            More <span aria-hidden="true">+</span>
                        </summary>

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
                                        href={
                                            isEmail
                                                ? `mailto:${value}`
                                                : value
                                        }
                                        target={isEmail ? undefined : "_blank"}
                                        rel={
                                            isEmail
                                                ? undefined
                                                : "noopener noreferrer"
                                        }
                                        key={name}
                                    >
                                        {name}
                                        {!isEmail && " ↗"}
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
                </nav>
            </header>

            {children}

            <footer className="site-footer">
                <span>
                    © {new Date().getFullYear()} {site.site.fullName}
                </span>

                <span>
                    Built with care, curiosity and plain old HTML.
                </span>
            </footer>
        </div>
    );
}