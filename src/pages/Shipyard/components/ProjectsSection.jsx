import site from "../../../data/site";

import Heading from "./Heading";


function ProjectsSection() {
    return (
        <section
            id="projects"
            className="section"
        >
            <Heading
                eyebrow="Selected work"
                title="Projects"
                description="Small systems, useful tools and ongoing experiments."
            />

            <div className="project-grid">
                {site.projects.map((project) => (
                    <article
                        className="project-card"
                        key={project.name}
                    >
                        <div className="project-content">
                            <p className="eyebrow">
                                {project.status}
                            </p>

                            <h3>
                                {project.name}
                            </h3>

                            <p>
                                {project.description}
                            </p>
                        </div>

                        <footer>
                            <span>
                                {project.technologies.join(" · ")}
                            </span>

                            {project.url ? (
                                <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Explore
                                    <span aria-hidden="true">
                                        {" "}→
                                    </span>
                                </a>
                            ) : (
                                <span className="project-status">
                                    In the workshop
                                </span>
                            )}
                        </footer>
                    </article>
                ))}
            </div>
        </section>
    );
}


export default ProjectsSection;