import { useEffect, useRef, useState } from "preact/hooks";
import useSite from "@/hooks/useSite";
import site from "@/data/site"
import MoreMenu from "./Menu"


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

function useHeaderVisible( setHeaderVisible, isMenuActive ) {
    useEffect(() => {
        let lastScrollY = window.scrollY;
        let lastMouseY = window.innerHeight;

        function handleMouseMove(event) {
            const currentMouseY = event.clientY;
            const movingDown = currentMouseY > lastMouseY;

            if (currentMouseY < 75 || isMenuActive()) {
                setHeaderVisible(true);
            } else if (
                window.scrollY >= 72 &&
                movingDown
            ) {
                setHeaderVisible(false);
            }
            lastMouseY = currentMouseY;
        };
        
        function handleScroll() {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY;

            if (currentScrollY < 72 || isMenuActive()) {
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
        }
    }, []);
}

function HeaderElement({ headerRef, menuRef, panelRef }) {
    const [theme, setTheme] = useState(getInitialTheme);
    const sitedata = useSite("site");

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("akhand.dev:theme", theme);
        site.put("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    };

    return (
        <header ref={headerRef} className="site-header">
            <a className="logo" href="#home" aria-label={`${sitedata.name} home`}>
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
                
                <MoreMenu menuRef={menuRef} panelRef={panelRef}/>
                
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
    );
}

function Header() {
    const headerRef = useRef(null);
    const menuRef = useRef(null);
    const panelRef = useRef(null);

    const setHeaderVisible = (visible) => {
        headerRef.current?.classList.toggle(
            "hidden",
            !visible
        );
    };

    const isMenuActive = () => {
        return menuRef.current?.open ?? false;
    };

    useHeaderVisible(
        setHeaderVisible, 
        isMenuActive
    );

    return (
        <HeaderElement
            headerRef={headerRef}
            menuRef={menuRef}
            panelRef={panelRef}
        />
    );
}

export default Header