import site from "../../../data/site";


function Hero() {
    return (
        <section className="hero section">
            <div
                className="pixel-field"
                aria-hidden="true"
            >
                {Array.from(
                    { length: 48 },
                    (_, index) => (
                        <i
                            key={index}
                            style={{
                                "--x": index % 12,
                                "--y": Math.floor(index / 12),
                                "--delay": `${
                                    (index % 9) * -0.6
                                }s`,
                            }}
                        />
                    )
                )}
            </div>

            <div className="hero-content">
                <p className="eyebrow">
                    {site.hero.eyebrow}
                </p>

                <h1>
                    {site.hero.title}
                </h1>

                <p className="hero-description">
                    {site.hero.subtitle}
                </p>

                <a
                    className="primary-button"
                    href={site.hero.ctaTarget}
                >
                    {site.hero.ctaLabel}

                    <span aria-hidden="true">
                        ↓
                    </span>
                </a>
            </div>
        </section>
    );
}


export default Hero;