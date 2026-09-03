import site from "../../../data/site";


function AskSection() {
    const hasContact = Boolean(site.social.email);

    return (
        <section
            id="ask"
            className="section ask-section"
        >
            <p className="eyebrow">
                Open invitation
            </p>

            <h2>
                {site.askMe.title}
            </h2>

            <p>
                {site.askMe.description}
            </p>

            {hasContact ? (
                <a
                    className="primary-button"
                    href={`mailto:${site.social.email}`}
                >
                    Get in touch

                    <span aria-hidden="true">
                        ↗
                    </span>
                </a>
            ) : (
                <p className="contact-unavailable">
                    {site.askMe.unavailableLabel}
                </p>
            )}
        </section>
    );
}


export default AskSection;