import useSite from "@/hooks/useSite";


function Footer() {
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

export default Footer