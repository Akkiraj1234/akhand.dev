import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import site from "../../../data/site";

import {
    getIntensity,
    loadActivity,
    mergeActivity,
    summarizeActivity,
} from "../../../services/activity";

import Heading from "./Heading";

import ActivityMonth from "../activity/ActivityMonth";
import ActivityEmpty from "../activity/ActivityEmpty";


function formatDate(date) {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(
        new Date(`${date}T00:00:00Z`)
    );
}


function activityWindow(days = 180) {
    const end = new Date();
    const start = new Date(end);

    start.setUTCDate(
        start.getUTCDate() - (days - 1)
    );

    const toIso = (date) =>
        date.toISOString().slice(0, 10);

    return {
        from: toIso(start),
        to: toIso(end),
    };
}


function buildMonths(
    from,
    to,
    activityByDate
) {
    const start = new Date(
        `${from}T00:00:00Z`
    );

    const end = new Date(
        `${to}T00:00:00Z`
    );

    const months = [];

    let cursor = new Date(
        Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            1
        )
    );

    while (cursor <= end) {
        const year =
            cursor.getUTCFullYear();

        const month =
            cursor.getUTCMonth() + 1;

        const monthStart =
            new Date(
                Date.UTC(
                    year,
                    month - 1,
                    1
                )
            );

        const monthEnd =
            new Date(
                Date.UTC(
                    year,
                    month,
                    0
                )
            );

        const fromDay =
            monthStart < start
                ? start
                : monthStart;

        const toDay =
            monthEnd > end
                ? end
                : monthEnd;

        const days = [];

        for (
            let date = new Date(fromDay);
            date <= toDay;
            date.setUTCDate(
                date.getUTCDate() + 1
            )
        ) {
            const key =
                date.toISOString()
                    .slice(0, 10);

            days.push({
                date: key,
                total:
                    activityByDate.get(
                        key
                    ) ?? 0,
            });
        }

        months.push({
            year,
            month,
            days,
        });

        cursor = new Date(
            Date.UTC(
                year,
                month,
                1
            )
        );
    }

    return months;
}


function ActivitySection() {
    const sourceList = useMemo(
        () => [
            {
                key: "all",
                label: "All",
            },
            ...(site.activitySources ?? []).map(
                (source) => ({
                    key: source,
                    label:
                        source.charAt(0)
                            .toUpperCase() +
                        source.slice(1),
                })
            ),
        ],
        []
    );

    const [source, setSource] =
        useState("all");

    const [activities, setActivities] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);

    const [selected, setSelected] =
        useState(null);

    const refreshRef =
        useRef(null);

    const range = useMemo(
        () => activityWindow(180),
        []
    );

    useEffect(() => {
        let active = true;

        async function fetchActivity() {
            setLoading(true);
            setError(null);

            try {
                const result =
                    await loadActivity({
                        from: range.from,
                        to: range.to,
                        source,
                    });

                if (!active) {
                    return;
                }

                setActivities(
                    mergeActivity(result)
                );
            } catch (err) {
                if (!active) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load activity."
                );

                setActivities([]);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        fetchActivity();

        return () => {
            active = false;
        };
    }, [range, source]);

    const activityByDate =
        useMemo(() => {
            const map = new Map();

            for (const item of activities) {
                map.set(
                    item.date,
                    item.total
                );
            }

            return map;
        }, [activities]);

    const months = useMemo(
        () =>
            buildMonths(
                range.from,
                range.to,
                activityByDate
            ),
        [
            range,
            activityByDate,
        ]
    );

    const summary = useMemo(
        () =>
            summarizeActivity(
                activities
            ),
        [activities]
    );

    const maxActivity =
        useMemo(
            () =>
                Math.max(
                    0,
                    ...activities.map(
                        (item) =>
                            item.total
                    )
                ),
            [activities]
        );

    const hasActivity =
        activities.length > 0 &&
        maxActivity > 0;

    useEffect(() => {
        if (!selected) {
            return;
        }

        const exists =
            activities.some(
                (item) =>
                    item.date ===
                    selected.date
            );

        if (!exists) {
            setSelected(null);
        }
    }, [activities, selected]);

    const handleRefresh =
        async () => {
            if (refreshRef.current) {
                return;
            }

            refreshRef.current = true;

            setLoading(true);
            setError(null);

            try {
                const result =
                    await loadActivity({
                        from: range.from,
                        to: range.to,
                        source,
                        refresh: true,
                    });

                setActivities(
                    mergeActivity(result)
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to refresh activity."
                );
            } finally {
                refreshRef.current = false;
                setLoading(false);
            }
        };

    return (
        <section
            id="activity"
            className="section activity-section"
        >
            <Heading
                eyebrow="Open-source footprint"
                title="Activity"
                description="A rolling view of public activity across the sources I connect."
            />

            <div className="activity-toolbar">
                <div className="activity-sources">
                    {sourceList.map(
                        (item) => (
                            <button
                                key={item.key}
                                type="button"
                                className={
                                    source ===
                                    item.key
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setSource(
                                        item.key
                                    )
                                }
                            >
                                {item.label}
                            </button>
                        )
                    )}
                </div>

                <button
                    type="button"
                    className="activity-refresh"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading
                        ? "Loading..."
                        : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="activity-error">
                    {error}
                </div>
            )}

            {!loading &&
            !error &&
            !hasActivity ? (
                <ActivityEmpty
                    source={source}
                    loading={loading}
                />
            ) : (
                <div className="activity-card">
                    <div className="activity-main">
                        <div className="activity-card-heading">
                            <div>
                                <p className="eyebrow">
                                    Last 180 days
                                </p>

                                <h3>
                                    {summary.total}{" "}
                                    activities
                                </h3>
                            </div>

                            {selected && (
                                <div className="activity-selected">
                                    <span>
                                        {formatDate(
                                            selected.date
                                        )}
                                    </span>

                                    <strong>
                                        {selected.total}
                                    </strong>
                                </div>
                            )}
                        </div>

                        <div className="activity-heatmap">
                            {months.map(
                                (month) => (
                                    <ActivityMonth
                                        key={`${month.year}-${month.month}`}
                                        month={month}
                                        selected={selected}
                                        onSelect={
                                            setSelected
                                        }
                                    />
                                )
                            )}
                        </div>
                    </div>

                    <aside className="activity-sidebar">
                        <p className="eyebrow">
                            Summary
                        </p>

                        <dl>
                            <div>
                                <dt>
                                    Total
                                </dt>

                                <dd>
                                    {summary.total}
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Active days
                                </dt>

                                <dd>
                                    {summary.activeDays}
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Current streak
                                </dt>

                                <dd>
                                    {summary.streak}
                                </dd>
                            </div>

                            <div>
                                <dt>
                                    Peak
                                </dt>

                                <dd>
                                    {maxActivity}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>
            )}
        </section>
    );
}


export default ActivitySection;