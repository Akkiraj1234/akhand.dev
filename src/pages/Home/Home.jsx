import MainLayout from "@/layout/MainLayout";

import Hero from "./Hero/Hero";
import AboutSection from "./AboutSection/AboutSection";
import CurrentlySection from "./CurrentlySection/CurrentlySection";
import ProjectsSection from "./ProjectsSections/ProjectsSection";
import PhilosophySection from "./PhilosophySections/PhilosophySection";
import ActivitySection from "./ActivitySection/ActivitySection";
import AskSection from "./AskSection/AskSection";


function Home() {
    return (
        <MainLayout>
            <main id="home">
                <Hero />
                <CurrentlySection />
                <ActivitySection />
                <ProjectsSection />
                <PhilosophySection />
                <AboutSection />
                <AskSection />
            </main>
        </MainLayout>
    );
}

export default Home;
export { Home };
