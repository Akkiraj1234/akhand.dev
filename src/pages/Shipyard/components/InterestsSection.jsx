import site from "../../../data/site";

import Heading from "./Heading";


function InterestsSection() {
    return (
        <section className="section into-section">
            <Heading
                eyebrow="A living list"
                title="What I’m into"
            />

            <dl>
                {site.currentlyInto.map((item) => (
                    <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}


export default InterestsSection;