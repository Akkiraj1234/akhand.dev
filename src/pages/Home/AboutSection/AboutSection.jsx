import Heading from "@/components/Heading";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import site from "@/data/site";

import "./aboutsection.css";


function AboutSection() {
    const about = site.get("about") ?? {};

    return (
        <SectionErrorBoundary name="About">
            <section
                id="about"
                className="about-section container"
            >
                <Heading
                    eyebrow="A little context"
                    title="About"
                />

                <div className="about-copy">
                    <p className="about-lead">
                        {about.short ?? "A short introduction is not available yet."}
                    </p>

                    <p>
                        {about.full ?? "More details will be shared soon."}
                    </p>
                </div>
            </section>
        </SectionErrorBoundary>
    );
}


export default AboutSection;