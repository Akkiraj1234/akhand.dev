import Heading from "@/components/Heading";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import useSite from "@/hooks/useSite";

import "./philosophysection.css";


function PhilosophySection() {
    const philosophy = useSite("philosophy") ?? [];
    const items = Array.isArray(philosophy) ? philosophy : [];

    return (
        <SectionErrorBoundary name="Philosophy">
            <section className="philosophy-section container">
                <Heading
                    eyebrow="How I approach the work"
                    title="Engineering philosophy"
                />

                {items.length ? (
                    <div className="philosophy-list">
                        {items.map((item, index) => (
                            <article key={item.title ?? `philosophy-${index}`}>
                                <span className="philosophy-index">
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                <div>
                                    <h3>{item.title}</h3>

                                    <p>{item.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="site-data-message">
                        The philosophy notes are being prepared.
                    </p>
                )}
            </section>
        </SectionErrorBoundary>
    );
}


export default PhilosophySection;