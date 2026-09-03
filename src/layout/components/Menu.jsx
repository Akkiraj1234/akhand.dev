import { useEffect } from "preact/hooks";
import useSite from "../../hooks/useSite";


function isInsideRect(event, rect, padding) {
    return (
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding
    );
}

function useMenuBoundary( menuRef, panelRef ) {
    const padding = 20;

    const handleMouseMove = (event) => {
        const menu = menuRef.current;
        const panel = panelRef.current;

        if (!menu?.open || !panel) {
            return;
        }

        const panelRect = panel.getBoundingClientRect();
        const summary = menu.querySelector("summary");

        if (!summary) {
            return;
        }

        const summaryRect = summary.getBoundingClientRect();
        const inside =
                isInsideRect(event, panelRect, padding) ||
                isInsideRect(event, summaryRect, padding);
        
        if (!inside) {
            menu.removeAttribute('open');
        }
    };

    useEffect(() => {
        document.addEventListener(
            "mousemove", 
            handleMouseMove
        );
        return () => {
            document.removeEventListener(
                "mousemove", 
                handleMouseMove
            );
        }
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

function MoreMenu({ menuRef, panelRef }) {
    // data fatch for profile and contacts
    // happen in MoreMenuPanel
    useMenuBoundary(menuRef, panelRef);

    return (
        <details ref={menuRef} className="more-menu">
            <summary>More</summary>
            <MoreMenuPanel
                panelRef={panelRef}
            />
        </details>
    );
}

export default MoreMenu