import Heading from "@/components/Heading";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import useSite from "@/hooks/useSite";

import "./projectssection.css";


function ProjectsSection() {
    const record = useSite("feature-repo") ?? useSite("projects") ?? {};
    const payload = record?.data ?? record;
    const items = Array.isArray(payload?.projects)
        ? payload.projects
        : Array.isArray(payload)
            ? payload
            : [];

    return (
        <SectionErrorBoundary name="Projects">
            <section
                id="projects"
                className="projects-section container"
            >
                <Heading
                    eyebrow="Selected work"
                    title="Projects"
                    description="Small systems, useful tools and ongoing experiments."
                />

                {items.length ? (
                    <div className="project-grid">
                        {items.map((project) => (
                            <article
                                className="project-card"
                                key={project.name ?? project.title ?? Math.random().toString(36).slice(2, 9)}
                            >
                                <div className="project-content">
                                    <p className="project-status-label">
                                        {project.status ?? "Project"}
                                    </p>

                                    <h3>
                                        {project.name ?? project.title ?? "Untitled project"}
                                    </h3>

                                    <p>
                                        {project.description ?? "Project details are being prepared."}
                                    </p>
                                </div>

                                <footer>
                                    <span>
                                        {Array.isArray(project.technologies)
                                            ? project.technologies.join(" · ")
                                            : project.stack ?? ""}
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
                ) : (
                    <p className="site-data-message">
                        No project updates have been published yet.
                    </p>
                )}
            </section>
        </SectionErrorBoundary>
    );
}


export default ProjectsSection;