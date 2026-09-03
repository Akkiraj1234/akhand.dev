const LANGUAGE_CONFIG = {
    Python: {
        icon: "https://api.iconify.design/devicon:python.svg",
        color: "#3776AB",
    },

    "C++": {
        icon: "https://api.iconify.design/devicon:cplusplus.svg",
        color: "#00599C",
    },

    JavaScript: {
        icon: "https://api.iconify.design/devicon:javascript.svg",
        color: "#F7DF1E",
    },
};


function LanguageList({ languages }) {
    return (
        <div className="language-list">
            {Object.entries(languages).map(([language, percentage]) => {
                const config = LANGUAGE_CONFIG[language];

                return (
                    <div
                        className="language-card"
                        key={language}
                        style={{
                            "--language-color":
                                config?.color ?? "currentColor",
                        }}
                    >
                        {config?.icon && (
                            <img
                                src={config.icon}
                                alt=""
                                aria-hidden="true"
                                className="language-icon"
                            />
                        )}

                        <span className="language-name">
                            {language}
                        </span>

                        <span className="language-percentage">
                            {percentage}%
                        </span>
                    </div>
                );
            })}
        </div>
    );
}


export default LanguageList;

