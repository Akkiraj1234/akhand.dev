import { MainLayout } from "../../layout/MainLayout";

import Hero from "./components/Hero";
// import CurrentlySection from "./components/CurrentlySection";
// import ActivitySection from "./components/ActivitySection";
// import ProjectsSection from "./components/ProjectsSection";
// import PhilosophySection from "./components/PhilosophySection";
// import AboutSection from "./components/AboutSection";
// import InterestsSection from "./components/InterestsSection";
// import BlogSection from "./components/BlogSection";
// import AskSection from "./components/AskSection";


function Home() {
    return (
        <MainLayout>
            <main id="home">
                <Hero />
                {/* <CurrentlySection />
                <ActivitySection />
                <ProjectsSection />
                <PhilosophySection />
                <AboutSection />
                <InterestsSection />
                <BlogSection />
                <AskSection /> */}
            </main>
        </MainLayout>
    );
}

export default Home;
export { Home };