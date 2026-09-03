import { useState } from "preact/hooks";
import useSite from "../../../hooks/useSite";
import Heading from "../../Shipyard/components/Heading";
import "./CurrentlySection.css"


function CurrentlySection() {
    const currently = useSite("currently");
    const [selectedProject, setSelectedProject] = useState(0);

    const project = currently.projects[selectedProject];

    return (
        <section
            id="currently"
            className="section current-section"
        >
            <Heading
                eyebrow={currently.label}
            />

            <div className="current-grid">

                <div className="current-main">
                    <h3 className="current-project-name">
                        {project.name}
                    </h3>

                    <div className="current-description">
                        <p>
                            {project.description}
                        </p>
                    </div>

                    <div className="current-meta">
                        <p className="eyebrow">
                            Status
                        </p>

                        <strong>
                            {project.status}
                        </strong>
                    </div>

                    <div className="current-meta">
                        <p className="eyebrow">
                            Topics
                        </p>

                        <ul>
                            {project.topics.map((topic) => (
                                <li key={topic}>
                                    {topic}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="current-meta">
                        <p className="eyebrow">
                            Languages
                        </p>

                        <ul>
                            {Object.entries(project.languages).map(
                                ([language, percentage]) => (
                                    <li key={language}>
                                        {language} {percentage}%
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    <div className="current-meta">
                        <p className="eyebrow">
                            Commits
                        </p>

                        <strong>
                            {project.commits}
                        </strong>
                    </div>
                </div>

                <nav
                    className="current-projects"
                    aria-label="Currently building projects"
                >
                    {currently.projects.map((item, index) => (
                        <button
                            key={item.name}
                            type="button"
                            className={
                                index === selectedProject
                                    ? "current-project active"
                                    : "current-project"
                            }
                            onClick={() => setSelectedProject(index)}
                        >
                            {item.name}
                        </button>
                    ))}
                </nav>

            </div>
        </section>
    );
}


export default CurrentlySection;