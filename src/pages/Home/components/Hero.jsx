import useSite from "../../../hooks/useSite"

function Hero() {
    const hero = useSite("hero")
    const Pixel = (
        <div className="pixel-field" aria-hidden="true">
            {Array.from({ length: 48 }, (_, index) => (
                <i
                    key={index}
                    className={
                        index % 11 === 0
                            ? "pixel pixel-bright"
                            : "pixel"
                    }
                    style={{
                        "--x": index % 12,
                        "--y": Math.floor(index / 12),
                        "--delay": `${(index % 9) * -0.6}s`,
                    }}
                />
            ))}
        </div>
    );
    const HeroContent = (
        <div className="hero-content">
            <p className="eyebrow"> {hero.eyebrow} </p>
            <h1> {hero.title} </h1>
            <p className="hero-description"> {hero.subtitle} </p>
            <a className="primary-button" href={hero.ctaTarget}>
                {hero.ctaLabel}
                <span aria-hidden="true">↓</span>
            </a>
        </div>
    )

    return (
        <section className="hero section">
            {Pixel}
            {HeroContent}
        </section>
    );
}


export default Hero;