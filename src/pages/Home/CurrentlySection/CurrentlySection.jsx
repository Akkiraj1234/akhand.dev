import {LanguageList, RenderCard} from "@/components/LanguageList";
import { useEffect, useRef, useState } from "preact/hooks";
import useSite from "@/hooks/useSite";
import Heading from "@/components/Heading";
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

function CurrentlySection() {
    const currentlyRecord = useSite("currently");
    const [selectedProject, setSelectedProject] = useState(0);

    const currently = currentlyRecord?.data;
    const loadStatus = currentlyRecord?.["site-load-status"] ?? "loading";
    const dataStatus = currentlyRecord?.["site-data-status"];
    const projects = Array.isArray(currently?.projects) ? currently.projects : [];
    const project = projects[selectedProject] ?? projects[0];

    useEffect(() => {
        if (selectedProject >= projects.length) {
            setSelectedProject(0);
        }
    }, [projects.length, selectedProject]);

    return (
        <section id="currently" className="current-section container">
            <Heading
                title={currently?.label ?? "Currently building"}
                description="Projects I'm working on"
            />

            {loadStatus === "error" && (
                <p className="site-data-message" role="status">
                    Live projects are temporarily unavailable. The rest of the site is still here.
                </p>
            )}

            {loadStatus === "ready" && dataStatus === "error" && (
                <p className="site-data-message" role="status">
                    Showing saved project data. Could not check for updates right now.
                </p>
            )}

            {loadStatus === "loading" && (
                <p className="site-data-message" role="status">Loading current projects…</p>
            )}

            {loadStatus === "ready" && !projects.length && (
                <p className="site-data-message">No current projects have been published yet.</p>
            )}

            {project && (
                <div className="current-layout">
                    <CurrentContent project={project}/>

                    <CurrentProjects
                        data={{ projects }}
                        onClickFunc={setSelectedProject}
                        currIdx={selectedProject}
                    />
                </div>
            )}
        </section>
    );
}


export default CurrentlySection;
