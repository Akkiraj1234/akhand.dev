import Heading from "@/components/Heading";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import site from "@/data/site";

import "./asksection.css";


function AskSection() {
    const social = site.get("social") ?? {};
    const ask = site.get("askMe") ?? {};
    const hasContact = Boolean(social.email);

    return (
        <SectionErrorBoundary name="Ask">
            <section
                id="ask"
                className="ask-section"
            >
                <Heading
                    eyebrow="Open invitation"
                    title={ask.title ?? "Ask me something."}
                    description={ask.description ?? ""}
                />

                {hasContact ? (
                    <a
                        className="primary-button"
                        href={`mailto:${social.email}`}
                    >
                        Get in touch

                        <span aria-hidden="true">
                            ↗
                        </span>
                    </a>
                ) : (
                    <p className="contact-unavailable">
                        {ask.unavailableLabel ?? "Contact details are being set up. Check back soon."}
                    </p>
                )}
            </section>
        </SectionErrorBoundary>
    );
}


export default AskSection;