import MainLayout from "@/layout/MainLayout";

import Hero from "./Hero/Hero";
import CurrentlySection from "./CurrentlySection/CurrentlySection";
import ActivitySection from "./ActivitySection/ActivitySection";
// import ProjectsSection from "./components/ProjectsSection";
// import PhilosophySection from "./components/PhilosophySection";
// import AboutSection from "./components/AboutSection";
// import InterestsSection from "./components/InterestsSection";
// import BlogSection from "./components/BlogSection";
// import AskSection from "./components/AskSection";


function Home() {
    return (
        <MainLayout>
            <main id="home" className="root_section">
                <Hero />
                <CurrentlySection />
                <ActivitySection />
            </main>
        </MainLayout>
    );
}

export default Home;
export { Home };
