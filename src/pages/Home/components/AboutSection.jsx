import site from "../../../data/site";

import Heading from "./Heading";


function AboutSection() {
    return (
        <section
            id="about"
            className="section about-section"
        >
            <Heading
                eyebrow="A little context"
                title="About"
            />

            <div className="about-copy">
                <p className="about-lead">
                    {site.about.short}
                </p>

                <p>
                    {site.about.full}
                </p>
            </div>
        </section>
    );
}


export default AboutSection;