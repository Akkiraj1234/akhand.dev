const LANGUAGE_CONFIG = {
    // Programming
    Python: {
        icon: "https://api.iconify.design/devicon:python.svg",
    },

    JavaScript: {
        icon: "https://api.iconify.design/devicon:javascript.svg",
    },

    TypeScript: {
        icon: "https://api.iconify.design/devicon:typescript.svg",
    },

    Java: {
        icon: "https://api.iconify.design/devicon:java.svg",
    },

    "C++": {
        icon: "https://api.iconify.design/devicon:cplusplus.svg",
    },

    C: {
        icon: "https://api.iconify.design/devicon:c.svg",
    },

    "C#": {
        icon: "https://api.iconify.design/devicon:csharp.svg",
    },

    Go: {
        icon: "https://api.iconify.design/devicon:go.svg",
    },

    Rust: {
        icon: "https://api.iconify.design/devicon:rust.svg",
    },

    Ruby: {
        icon: "https://api.iconify.design/devicon:ruby.svg",
    },

    PHP: {
        icon: "https://api.iconify.design/devicon:php.svg",
    },

    Swift: {
        icon: "https://api.iconify.design/devicon:swift.svg",
    },

    Kotlin: {
        icon: "https://api.iconify.design/devicon:kotlin.svg",
    },

    Dart: {
        icon: "https://api.iconify.design/devicon:dart.svg",
    },

    R: {
        icon: "https://api.iconify.design/devicon:r.svg",
    },

    Scala: {
        icon: "https://api.iconify.design/devicon:scala.svg",
    },

    Perl: {
        icon: "https://api.iconify.design/devicon:perl.svg",
    },

    Lua: {
        icon: "https://api.iconify.design/devicon:lua.svg",
    },

    Haskell: {
        icon: "https://api.iconify.design/devicon:haskell.svg",
    },

    Elixir: {
        icon: "https://api.iconify.design/devicon:elixir.svg",
    },

    Erlang: {
        icon: "https://api.iconify.design/devicon:erlang.svg",
    },

    Clojure: {
        icon: "https://api.iconify.design/devicon:clojure.svg",
    },

    FSharp: {
        icon: "https://api.iconify.design/devicon:fsharp.svg",
    },

    // Web
    HTML: {
        icon: "https://api.iconify.design/devicon:html5.svg",
    },

    CSS: {
        icon: "https://api.iconify.design/devicon:css3.svg",
    },

    SCSS: {
        icon: "https://api.iconify.design/devicon:sass.svg",
    },

    Less: {
        icon: "https://api.iconify.design/devicon:less.svg",
    },

    // Shell / scripting
    Shell: {
        icon: "https://api.iconify.design/devicon:bash.svg",
    },

    Bash: {
        icon: "https://api.iconify.design/devicon:bash.svg",
    },

    PowerShell: {
        icon: "https://api.iconify.design/devicon:powershell.svg",
    },

    // Data / configuration
    JSON: {
        icon: "https://api.iconify.design/devicon:json.svg",
    },

    YAML: {
        icon: "https://api.iconify.design/devicon:yaml.svg",
    },

    TOML: {
        icon: "https://api.iconify.design/devicon:toml.svg",
    },

    XML: {
        icon: "https://api.iconify.design/devicon:xml.svg",
    },

    // Database
    SQL: {
        icon: "https://api.iconify.design/devicon:azuresqldatabase.svg",
    },

    PLpgSQL: {
        icon: "https://api.iconify.design/devicon:postgresql.svg",
    },

    // Mobile
    ObjectiveC: {
        icon: "https://api.iconify.design/devicon:objectivec.svg",
    },

    // Functional / other
    MATLAB: {
        icon: "https://api.iconify.design/devicon:matlab.svg",
    },

    Julia: {
        icon: "https://api.iconify.design/devicon:julia.svg",
    },

    Groovy: {
        icon: "https://api.iconify.design/devicon:groovy.svg",
    },

    other: {
        icon: "https://api.iconify.design/thesvg-color:htmx.svg",
    },
};




function RenderLangugaecard({key, language, percentage}) {
    const config = LANGUAGE_CONFIG[language] 
        ?? LANGUAGE_CONFIG["other"];

    return (
        <div className="language-card" key={key}>
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
    )
}


function LanguageList({ languages }) {
    return (
        <div className="language-list">
            {Object.entries(languages).map(
                ([language, percentage]) => (
                    <RenderLangugaecard
                        key={language}
                        language={language}
                        percentage={percentage}
                    />
                )
            )}
        </div>
    );
}


export default LanguageList;

