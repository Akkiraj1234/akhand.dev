import { useState } from "preact/hooks";
import useSite from "@/hooks/useSite"
import Heading from "@/components/Heading" 
import LanguageList from "@/components/LanguageList"
import "./currentlysection.css"



const CurrentProjects = ({ data, onClickFunc, currIdx }) => (
    <nav className="current-projects" aria-label="Currently building projects">
        {data.projects.map((item, index) => (
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
                {item.name}
            </button>
        ))}
    </nav>
)

const CurrentContent = ({ project }) => (
    <article className="current-content">
        <header className="current-content-header">
            <h3>{project.name}</h3>
            <p>{project.commits} commit</p>
        </header>

        <div className="current-content-description">
            <p>{project.description}</p>
        </div>

        <section className="current-content-topics">
            <h4 className="current-content-eyebrow"> Topics</h4>

            <ul>
                {project.topics.map((item, idx) => (
                    <li>{item}</li>
                ))}
            </ul>
        </section>
        
        <div className="current-content-details">
            <LanguageList languages={project.languages}/>
            <p>{"project star: "}{project.star}</p>
            <p>{project.release_version}</p>
        </div>
    </article>
)

function CurrentlySection() {
    const currently = useSite("currently");
    const [selectedProject, setSelectedProject] = useState(0);
    const project = currently.projects[selectedProject];

    return (
        <section id="currently" className="current-section container">
            <Heading 
                title={currently.label} 
                description="Projects I'm working on"
            />

            <div className="current-layout">
                <CurrentContent project={project}/>

                <CurrentProjects 
                    data={currently}
                    onClickFunc={setSelectedProject}
                    currIdx={selectedProject}
                />
            </div>
        </section>
    );
}


export default CurrentlySection;