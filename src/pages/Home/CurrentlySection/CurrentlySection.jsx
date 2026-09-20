import {LanguageList, RenderCard} from "@/components/LanguageList";
import { useEffect, useRef, useState } from "preact/hooks";
import useSite from "@/hooks/useSite";
import Heading from "@/components/Heading";
import ResourceState from "@/components/ResourceState";
import "./currentlysection.css";


const CurrentProjects = ({ data, onClickFunc, currIdx }) => {
    const currentProject = data.projects[currIdx];

    return (
        <nav
            className="current-projects"
            aria-label="Currently building projects"
        >
            <div className="current-projects-header">
                <span className="current-projects-label">
                    Projects
                </span>

                <div className="current-projects-meta">
                    <div className="current-projects-days-info">
                        <span className="current-projects-meta-label">
                            days:
                        </span>

                        <span className="current-projects-days">
                            {currentProject.active_days}
                        </span>
                    </div>

                    <span className="current-projects-date">
                        {currentProject.started_at}
                        {" — "}
                        {currentProject.ended_at ?? "Present"}
                    </span>
                </div>
            </div>
            
            <div className="current-project-list">
                {data.projects.slice(0, 3).map((item, index) => (
                    <button
                        key={item.name}
                        type="button"
                        className={
                            index === currIdx
                                ? "current-project active"
                                : "current-project"
                        }
                        onClick={() => onClickFunc(index)}
                    >
                        <span className="current-project-name">
                            {item.name}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

const CurrentContent = ({ project }) => {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const descriptionRef = useRef(null);

    useEffect(() => {
        setExpanded(false);

        const element = descriptionRef.current;

        if (!element) return;

        const checkOverflow = () => {
            setIsOverflowing(
                element.scrollHeight > element.clientHeight
            );
        };

        checkOverflow();

        window.addEventListener("resize", checkOverflow);

        return () => {
            window.removeEventListener("resize", checkOverflow);
        };
    }, [project.description]);

    return (
        <article className="current-content">
            <header className="current-content-header">
                <h3>{project.name}</h3>
                <p>{project.commits} commit</p>
            </header>

            <div
                className={
                    expanded
                        ? "current-content-description expanded"
                        : "current-content-description"
                }
            >
                <p ref={descriptionRef}>{project.description}</p>

                {(isOverflowing || expanded) && (
                    <button
                        type="button"
                        className="current-description-toggle"
                        onClick={() => setExpanded((value) => !value)}
                    >
                        {expanded ? "show less" : "read more"}
                    </button>
                )}
            </div>

            <section className="current-content-topics">
                <h4 className="current-content-eyebrow">
                    Topics
                </h4>

                <ul>
                    {project.topics.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </section>

            <div className="current-content-details">
                <LanguageList languages={project.languages} />
                <RenderCard
                    text1={project.star}
                    icon={"https://api.iconify.design/akar-icons:star.svg?color=%23eff6e9"}
                />
                <RenderCard
                    text1={project.release_version}
                />
            </div>
        </article>
    );
};


function CurrentlyContent({ data }) {
    const [selectedProject, setSelectedProject] = useState(0);

    const projects = Array.isArray(data?.projects)
        ? data.projects
        : [];

    const project =
        projects[selectedProject] ?? projects[0];

    useEffect(() => {
        if (selectedProject >= projects.length) {
            setSelectedProject(0);
        }
    }, [projects.length, selectedProject]);

    if (!project) {
        return (
            <p className="site-data-message">
                No current projects have been published yet.
            </p>
        );
    }

    return (
        <div className="current-layout">
            <CurrentContent project={project} />

            <CurrentProjects
                data={{ projects }}
                onClickFunc={setSelectedProject}
                currIdx={selectedProject}
            />
        </div>
    );
}


function CurrentlySection() {
    const currentlyRecord = useSite("currently");

    return (
        <section id="currently" className="current-section container">
            <Heading
                title={currentlyRecord?.data?.label ?? "Currently building"}
                description="Projects I'm working on"
            />

            <ResourceState
                data={currentlyRecord}
                render={(data) => (
                    <CurrentlyContent data={data} />
                )}
            />
        </section>
    );
}


export default CurrentlySection;
