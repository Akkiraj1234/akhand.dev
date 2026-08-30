import site from "../../../data/site";

import Heading from "./Heading";


function CurrentlySection() {
    return (
        <section
            id="currently"
            className="section current-section"
        >
            <Heading
                eyebrow={site.currently.label}
                title={site.currently.project}
            />

            <div className="current-grid">
                <div className="current-description">
                    <p>
                        {site.currently.description}
                    </p>
                </div>

                <div className="current-meta">
                    <p className="eyebrow">
                        Status
                    </p>

                    <strong>
                        {site.currently.status}
                    </strong>
                </div>

                <div className="current-meta">
                    <p className="eyebrow">
                        Focus
                    </p>

                    <ul>
                        {site.currently.focus.map(
                            (item) => (
                                <li key={item}>
                                    {item}
                                </li>
                            )
                        )}
                    </ul>
                </div>
            </div>
        </section>
    );
}


export default CurrentlySection;