import site from "../../../data/site";

import Heading from "./Heading";


function PhilosophySection() {
    return (
        <section className="section philosophy-section">
            <Heading
                eyebrow="How I approach the work"
                title="Engineering philosophy"
            />

            <div className="philosophy-list">
                {site.philosophy.map((item, index) => (
                    <article key={item.title}>
                        <span>
                            {String(index + 1).padStart(2, "0")}
                        </span>

                        <div>
                            <h3>{item.title}</h3>

                            <p>{item.description}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}


export default PhilosophySection;