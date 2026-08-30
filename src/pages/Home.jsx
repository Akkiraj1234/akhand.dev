import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "preact/hooks";
import site from "../data/site";
import {MainLayout} from "../layout/MainLayout";
import {
    getIntensity,
    loadActivity,
    mergeActivity,
    summarizeActivity,
} from "../services/activity";


function Heading({ eyebrow, title, description }) {
    return (
        <div className="section-heading">
            <p className="eyebrow">{eyebrow}</p>

            <h2>{title}</h2>

            {description && (
                <p className="section-intro">
                    {description}
                </p>
            )}
        </div>
    );
}


function formatDate(date) {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${date}T00:00:00Z`));
}


function formatMonth(year, month) {
    return new Intl.DateTimeFormat("en", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(
        new Date(
            Date.UTC(year, month - 1, 1)
        )
    );
}


function toDateKey(date) {
    return date.toISOString().slice(0, 10);
}


function getLatestDate(activity) {
    if (!activity.length) {
        return new Date();
    }

    return new Date(
        `${activity[activity.length - 1].date}T00:00:00Z`
    );
}


function startOfWeek(date) {
    const result = new Date(date);

    result.setUTCDate(
        result.getUTCDate() -
            result.getUTCDay()
    );

    return result;
}


function endOfWeek(date) {
    const result = new Date(date);

    result.setUTCDate(
        result.getUTCDate() +
            (6 - result.getUTCDay())
    );

    return result;
}


function buildActivityWindow(activity, weeks) {
    const latest = endOfWeek(
        getLatestDate(activity)
    );

    const earliest = startOfWeek(
        new Date(
            latest.getTime()
        )
    );

    earliest.setUTCDate(
        earliest.getUTCDate() -
            (weeks * 7 - 7)
    );

    const byDate = new Map();

    for (const item of activity) {
        byDate.set(item.date, item);
    }

    const months = new Map();

    const cursor = new Date(earliest);

    while (cursor <= latest) {
        const date = toDateKey(cursor);

        const year =
            cursor.getUTCFullYear();

        const month =
            cursor.getUTCMonth() + 1;

        const key =
            `${year}-${String(month).padStart(
                2,
                "0"
            )}`;

        if (!months.has(key)) {
            months.set(key, {
                year,
                month,
                days: [],
            });
        }

        const item =
            byDate.get(date);

        months.get(key).days.push({
            date,
            total: item?.total ?? 0,
            intensity: item?.intensity ?? 0,
            sources: item?.sources ?? {},
        });

        cursor.setUTCDate(
            cursor.getUTCDate() + 1
        );
    }

    return [...months.values()];
}


function ActivityMonth({
    month,
    selected,
    onSelect,
}) {
    const days = month.days;

    const firstDate = new Date(
        `${days[0].date}T00:00:00Z`
    );

    const lastDate = new Date(
        `${days[days.length - 1].date}T00:00:00Z`
    );

    const firstWeekday =
        firstDate.getUTCDay();

    const lastWeekday =
        lastDate.getUTCDay();

    const daysInMonth = new Date(
        Date.UTC(
            month.year,
            month.month,
            0
        )
    ).getUTCDate();

    const leading =
        firstDate.getUTCMonth() + 1 ===
            month.month
            ? firstWeekday
            : 0;

    const trailing =
        lastDate.getUTCMonth() + 1 ===
            month.month
            ? 6 - lastWeekday
            : 0;

    const monthDays = days.filter(
        (day) => {
            const date = new Date(
                `${day.date}T00:00:00Z`
            );

            return (
                date.getUTCMonth() + 1 ===
                month.month &&
                date.getUTCFullYear() ===
                month.year
            );
        }
    );

    const dayMap = new Map(
        monthDays.map((day) => [
            Number(day.date.slice(8, 10)),
            day,
        ])
    );

    const totalSlots =
        leading +
        daysInMonth +
        trailing;

    const columns =
        Math.ceil(totalSlots / 7);

    const cells = [];

    for (
        let slot = 0;
        slot < columns * 7;
        slot += 1
    ) {
        const dayNumber =
            slot - leading + 1;

        const valid =
            dayNumber >= 1 &&
            dayNumber <= daysInMonth;

        if (!valid) {
            cells.push(
                <span
                    key={`empty-${slot}`}
                    className="heatmap-day heatmap-day-empty"
                    aria-hidden="true"
                />
            );

            continue;
        }

        const date =
            `${month.year}-${String(
                month.month
            ).padStart(2, "0")}-${String(
                dayNumber
            ).padStart(2, "0")}`;

        const item =
            dayMap.get(dayNumber);

        const isSelected =
            selected?.date === date;

        cells.push(
            <button
                key={date}
                type="button"
                className={[
                    "heatmap-day",
                    `level-${
                        item?.intensity ?? 0
                    }`,
                    isSelected
                        ? "is-selected"
                        : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
                aria-label={`${formatDate(
                    date
                )}: ${
                    item?.total ?? 0
                } activities`}
                aria-pressed={isSelected}
                onMouseEnter={() =>
                    item && onSelect(item)
                }
                onFocus={() =>
                    item && onSelect(item)
                }
                onClick={() =>
                    item && onSelect(item)
                }
            />
        );
    }

    return (
        <div className="activity-month">
            <div className="activity-month-label">
                {formatMonth(
                    month.year,
                    month.month
                )}
            </div>

            <div
                className="activity-month-grid"
                role="grid"
                aria-label={`${formatMonth(
                    month.year,
                    month.month
                )} activity`}
                style={{
                    display: "grid",
                    gridTemplateRows:
                        "repeat(7, var(--activity-cell, 10px))",
                    gridTemplateColumns:
                        `repeat(${columns}, var(--activity-cell, 10px))`,
                }}
            >
                {cells.map(
                    (cell, index) => {
                        if (
                            !cell ||
                            !cell.props
                        ) {
                            return cell;
                        }

                        const column =
                            Math.floor(
                                index / 7
                            ) + 1;

                        const row =
                            (index % 7) + 1;

                        return (
                            <span
                                key={cell.key}
                                style={{
                                    display:
                                        "contents",
                                }}
                            >
                                {cell.type ===
                                "button"
                                    ? (
                                        <button
                                            {...cell.props}
                                            style={{
                                                ...cell.props.style,
                                                gridColumn:
                                                    column,
                                                gridRow:
                                                    row,
                                            }}
                                        />
                                    )
                                    : (
                                        <span
                                            {...cell.props}
                                            style={{
                                                ...cell.props.style,
                                                gridColumn:
                                                    column,
                                                gridRow:
                                                    row,
                                            }}
                                        />
                                    )}
                            </span>
                        );
                    }
                )}
            </div>
        </div>
    );
}


function ActivityEmpty({ source, loading }) {
    const label = source === "all" ? "public activity" : `${source} activity`;

    return (
        <div className="activity-empty">
            <span className="activity-empty-mark" aria-hidden="true" />
            <div>
                <p className="eyebrow">{loading ? "Checking sources" : "Nothing to plot yet"}</p>
                <p>{loading ? "Loading the latest public activity." : `There is no ${label} available for this period.`}</p>
            </div>
        </div>
    );
}


function ActivitySection() {
    const [state, setState] =
        useState({
            loading: true,
            activity: [],
            details: {},
            errors: {},
        });

    const [selected, setSelected] =
        useState(null);

    const [refresh, setRefresh] =
        useState(0);

    const [view, setView] =
        useState("all");

    const graphRef =
        useRef(null);


    useEffect(() => {
        let mounted = true;

        setState((current) => ({
            ...current,
            loading: true,
        }));

        loadActivity({
            profiles: site.profiles,
            settings: site.activity,
        })
            .then((result) => {
                if (!mounted) return;

                setState({
                    loading: false,
                    ...result,
                });
            })
            .catch(() => {
                if (!mounted) return;

                setState({
                    loading: false,
                    activity: [],
                    details: {},
                    errors: {
                        activity: true,
                    },
                });
            });

        return () => {
            mounted = false;
        };
    }, [refresh]);


    const sourceActivity =
        useMemo(
            () =>
                Object.fromEntries(
                    Object.entries(
                        state.details
                    ).map(
                        ([
                            source,
                            value,
                        ]) => [
                            source,
                            value.activity,
                        ]
                    )
                ),
            [state.details]
        );


    const visibleActivity =
        useMemo(() => {
            const activity =
                view === "all"
                    ? state.activity
                    : mergeActivity({
                          [view]:
                              sourceActivity[
                                  view
                              ] ?? [],
                      });

            const sorted = [...activity].sort(
                (a, b) =>
                    Date.parse(a.date) -
                    Date.parse(b.date)
            );

            const maximum = Math.max(
                0,
                ...sorted.map(
                    (item) => item.total
                )
            );

            return sorted.map((item) => ({
                ...item,
                intensity: getIntensity(
                    item.total,
                    maximum
                ),
            }));
        }, [
            view,
            state.activity,
            sourceActivity,
        ]);


    const months = useMemo(
        () =>
            buildActivityWindow(
                visibleActivity,
                site.activity.weeksToShow
            ),
        [visibleActivity]
    );


    const summary =
        summarizeActivity(
            visibleActivity
        );


    const profiles =
        Object.values(
            site.profiles
        ).filter(
            (profile) =>
                profile.enabled
        );


    const latestActivity =
        visibleActivity.at(-1) ??
        null;


    const initialSelected =
        latestActivity ??
        [...visibleActivity]
            .reverse()
            .find(
                (item) =>
                    item.total > 0
            ) ??
        null;


    const selectedDay =
        selected ??
        initialSelected;


    const currentError =
        view === "all"
            ? null
            : state.errors[view];


    useEffect(() => {
        const container =
            graphRef.current;

        if (!container) return;

        requestAnimationFrame(
            () => {
                container.scrollLeft =
                    Math.max(
                        0,
                        container.scrollWidth -
                            container.clientWidth
                    );
            }
        );
    }, [
        months,
        view,
        state.loading,
    ]);


    const tabs = [
        {
            id: "all",
            label: "All",
        },
        ...profiles.map(
            (profile) => ({
                id:
                    profile.label.toLowerCase(),
                label: profile.label,
            })
        ),
    ];


    return (
        <section
            id="activity"
            className="section activity-section"
            aria-labelledby="activity-heading"
        >
            <div className="activity-section-heading">
                <Heading
                    eyebrow="A combined public record"
                    title="Activity"
                    description="Everything I have been building, learning and contributing to, collected in one place."
                />

                <button
                    className="text-button"
                    type="button"
                    onClick={() =>
                        setRefresh(
                            (value) =>
                                value + 1
                        )
                    }
                    disabled={
                        state.loading
                    }
                >
                    {state.loading
                        ? "Updating…"
                        : "Refresh activity"}
                </button>
            </div>


            <div className="activity-card">
                <div className="activity-main">
                    <header className="activity-card-heading">
                        <div>
                            <p className="eyebrow">
                                Contribution calendar
                            </p>

                            <h3>
                                Last{" "}
                                {
                                    site
                                        .activity
                                        .weeksToShow
                                }{" "}
                                weeks
                            </h3>
                        </div>

                        <div className="activity-summary">
                            <div className="activity-stat">
                                <strong>
                                    {
                                        summary.total
                                    }
                                </strong>

                                <span>
                                    contributions
                                </span>
                            </div>

                            <div className="activity-stat">
                                <strong>
                                    {
                                        summary.activeDays
                                    }
                                </strong>

                                <span>
                                    active days
                                </span>
                            </div>
                        </div>
                    </header>


                    <div className="activity-filter">
                        <div
                            className="activity-tabs"
                            role="tablist"
                            aria-label="Activity source"
                        >
                            {tabs.map(
                                (tab) => (
                                    <button
                                        key={
                                            tab.id
                                        }
                                        type="button"
                                        role="tab"
                                        aria-selected={
                                            view ===
                                            tab.id
                                        }
                                        className={
                                            view ===
                                            tab.id
                                                ? "is-active"
                                                : ""
                                        }
                                        onClick={() => {
                                            setView(
                                                tab.id
                                            );
                                            setSelected(
                                                null
                                            );
                                        }}
                                    >
                                        {
                                            tab.label
                                        }
                                    </button>
                                )
                            )}
                        </div>
                    </div>


                    <div
                        className="heatmap-scroll"
                        ref={graphRef}
                    >
                        {visibleActivity.length ? (
                            <div
                                className="activity-months"
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    width: "max-content",
                                }}
                            >
                                {months.map((month) => (
                                    <ActivityMonth
                                        key={`${month.year}-${month.month}`}
                                        month={month}
                                        selected={selectedDay}
                                        onSelect={setSelected}
                                    />
                                ))}
                            </div>
                        ) : (
                            <ActivityEmpty
                                source={view}
                                loading={state.loading}
                            />
                        )}
                    </div>


                    <div
                        className="heatmap-legend"
                        aria-hidden="true"
                    >
                        <span>
                            Less
                        </span>

                        <div className="heatmap-levels">
                            {[
                                0,
                                1,
                                2,
                                3,
                                4,
                            ].map(
                                (
                                    level
                                ) => (
                                    <span
                                        key={
                                            level
                                        }
                                        className={`level-${level}`}
                                    />
                                )
                            )}
                        </div>

                        <span>
                            More
                        </span>
                    </div>
                </div>


                <aside className="activity-sidebar">
                    <div className="activity-detail">
                        <p className="eyebrow">
                            Selected day
                        </p>

                        <h3>
                            {selectedDay
                                ? formatDate(
                                      selectedDay.date
                                  )
                                : "No activity yet"}
                        </h3>

                        <p className="activity-total">
                            {
                                selectedDay
                                    ?.total ??
                                0
                            }{" "}
                            {(
                                selectedDay
                                    ?.total ??
                                0
                            ) === 1
                                ? "activity"
                                : "activities"}
                        </p>

                        <dl className="activity-breakdown">
                            {profiles.map(
                                (
                                    profile
                                ) => {
                                    const source =
                                        profile.label.toLowerCase();

                                    return (
                                        <div
                                            key={
                                                profile.label
                                            }
                                        >
                                            <dt>
                                                {
                                                    profile.label
                                                }
                                            </dt>

                                            <dd>
                                                {
                                                    selectedDay
                                                        ?.sources?.[
                                                        source
                                                    ] ??
                                                    0
                                                }
                                            </dd>
                                        </div>
                                    );
                                }
                            )}
                        </dl>
                    </div>

                    {state.loading && (
                        <p className="activity-status">
                            Updating activity…
                        </p>
                    )}
                </aside>
            </div>


            {currentError && (
                <p className="data-note">
                    {currentError.message ||
                        "This public source is currently unavailable."}
                </p>
            )}


            {view === "github" &&
                !state.loading &&
                !visibleActivity.length && (
                    <p className="data-note">
                        No recent public GitHub activity was
                        returned. Private contribution data can
                        be added later through a backend or another
                        authenticated data source.
                    </p>
                )}


            {view === "all" &&
                Object.keys(
                    state.errors
                ).length > 0 && (
                    <p className="data-note">
                        Some public activity is currently
                        unavailable. The rest of the site remains
                        fully available.
                    </p>
                )}


            <p className="sr-only">
                Use the keyboard to focus activity days
                and hear their totals.
            </p>
        </section>
    );
}


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
                                "--x":
                                    index %
                                    12,
                                "--y":
                                    Math.floor(
                                        index /
                                            12
                                    ),
                                "--delay": `${
                                    (index %
                                        9) *
                                    -0.6
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
                    href={
                        site.hero
                            .ctaTarget
                    }
                >
                    {
                        site.hero
                            .ctaLabel
                    }

                    <span aria-hidden="true">
                        ↓
                    </span>
                </a>
            </div>
        </section>
    );
}


function CurrentlySection() {
    return (
        <section
            id="currently"
            className="section current-section"
        >
            <Heading
                eyebrow={
                    site.currently
                        .label
                }
                title={
                    site.currently
                        .project
                }
            />

            <div className="current-grid">
                <div className="current-description">
                    <p>
                        {
                            site.currently
                                .description
                        }
                    </p>
                </div>

                <div className="current-meta">
                    <p className="eyebrow">
                        Status
                    </p>

                    <strong>
                        {
                            site.currently
                                .status
                        }
                    </strong>
                </div>

                <div className="current-meta">
                    <p className="eyebrow">
                        Focus
                    </p>

                    <ul>
                        {site.currently.focus.map(
                            (
                                item
                            ) => (
                                <li
                                    key={
                                        item
                                    }
                                >
                                    {
                                        item
                                    }
                                </li>
                            )
                        )}
                    </ul>
                </div>
            </div>
        </section>
    );
}


function ProjectsSection() {
    return (
        <section
            id="projects"
            className="section"
        >
            <Heading
                eyebrow="Selected work"
                title="Projects"
                description="Small systems, useful tools and ongoing experiments."
            />

            <div className="project-grid">
                {site.projects.map(
                    (
                        project
                    ) => (
                        <article
                            className="project-card"
                            key={
                                project.name
                            }
                        >
                            <div className="project-content">
                                <p className="eyebrow">
                                    {
                                        project.status
                                    }
                                </p>

                                <h3>
                                    {
                                        project.name
                                    }
                                </h3>

                                <p>
                                    {
                                        project.description
                                    }
                                </p>
                            </div>

                            <footer>
                                <span>
                                    {project.technologies.join(
                                        " · "
                                    )}
                                </span>

                                {project.url ? (
                                    <a
                                        href={
                                            project.url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Explore
                                        <span aria-hidden="true">
                                            {" "}
                                            →
                                        </span>
                                    </a>
                                ) : (
                                    <span className="project-status">
                                        In the workshop
                                    </span>
                                )}
                            </footer>
                        </article>
                    )
                )}
            </div>
        </section>
    );
}


function PhilosophySection() {
    return (
        <section className="section philosophy-section">
            <Heading
                eyebrow="How I approach the work"
                title="Engineering philosophy"
            />

            <div className="philosophy-list">
                {site.philosophy.map(
                    (
                        item,
                        index
                    ) => (
                        <article
                            key={
                                item.title
                            }
                        >
                            <span>
                                {String(
                                    index +
                                        1
                                ).padStart(
                                    2,
                                    "0"
                                )}
                            </span>

                            <div>
                                <h3>
                                    {
                                        item.title
                                    }
                                </h3>

                                <p>
                                    {
                                        item.description
                                    }
                                </p>
                            </div>
                        </article>
                    )
                )}
            </div>
        </section>
    );
}


function AboutSection() {
    return (
        <section
            id="about"
            className="section about-section"
        >
            <Heading
                eyebrow="A little context"
                title="About"
            />

            <div className="about-copy">
                <p className="about-lead">
                    {
                        site.about
                            .short
                    }
                </p>

                <p>
                    {
                        site.about
                            .full
                    }
                </p>
            </div>
        </section>
    );
}


function InterestsSection() {
    return (
        <section className="section into-section">
            <Heading
                eyebrow="A living list"
                title="What I’m into"
            />

            <dl>
                {site.currentlyInto.map(
                    (
                        item
                    ) => (
                        <div
                            key={
                                item.label
                            }
                        >
                            <dt>
                                {
                                    item.label
                                }
                            </dt>

                            <dd>
                                {
                                    item.value
                                }
                            </dd>
                        </div>
                    )
                )}
            </dl>
        </section>
    );
}


function BlogSection() {
    return (
        <section
            id="blog"
            className="section"
        >
            <Heading
                eyebrow="Technical notes, eventually"
                title="Latest posts"
            />

            <div className="blog-list">
                {site.blog.map(
                    (
                        post
                    ) => (
                        <article
                            key={
                                post.title
                            }
                        >
                            <div>
                                <p className="eyebrow">
                                    {
                                        post.date
                                    }
                                </p>

                                <h3>
                                    {
                                        post.title
                                    }
                                </h3>

                                <p>
                                    {
                                        post.description
                                    }
                                </p>
                            </div>

                            <p className="tags">
                                {post.tags.join(
                                    " / "
                                )}
                            </p>
                        </article>
                    )
                )}
            </div>
        </section>
    );
}


function AskSection() {
    const hasContact =
        Boolean(
            site.social.email
        );

    return (
        <section
            id="ask"
            className="section ask-section"
        >
            <p className="eyebrow">
                Open invitation
            </p>

            <h2>
                {
                    site.askMe.title
                }
            </h2>

            <p>
                {
                    site.askMe
                        .description
                }
            </p>

            {hasContact ? (
                <a
                    className="primary-button"
                    href={`mailto:${site.social.email}`}
                >
                    Get in touch

                    <span
                        aria-hidden="true"
                    >
                        ↗
                    </span>
                </a>
            ) : (
                <p className="contact-unavailable">
                    {
                        site.askMe
                            .unavailableLabel
                    }
                </p>
            )}
        </section>
    );
}


export default function Home() {
    return (
        <MainLayout>
            <main id="home">
                <Hero />

                <CurrentlySection />

                <ActivitySection />

                <ProjectsSection />

                <PhilosophySection />

                <AboutSection />

                <InterestsSection />

                <BlogSection />

                <AskSection />
            </main>
        </MainLayout>
    );
}
