import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import ResourceState from "@/components/ResourceState";
import Heading from "@/components/Heading";
import useSite from "@/hooks/useSite";

import format_heatmap from "./format_heatmap";
import "./activitysection.css";


const SOURCE_OPTIONS = [
    { key: "all", label: "All" },
    { key: "github", label: "GitHub" },
    { key: "leetcode", label: "LeetCode" },
    { key: "roadmap", label: "Roadmap" },
];

// Keep these in sync with the --activity-cell / --activity-gap values
// and the 16px column gap defined in activitysection.css.
const MONTH_CELL = 10;
const MONTH_CELL_GAP = 3;
const MONTH_WIDTH = 5 * MONTH_CELL + 4 * MONTH_CELL_GAP; // 62
const MONTH_COLUMN_GAP = 16;


function formatDate(timestamp) {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(timestamp));
}


function getDayCount(day, source) {
    if (source === "all") {
        return day.total ?? 0;
    }

    return day.sources?.[source] ?? 0;
}


function getActivityLevel(count, max) {
    if (count <= 0 || max <= 0) {
        return 0;
    }

    if (count === 1) {
        return 1;
    }

    if (count === 2) {
        return 2;
    }

    if (count < 5) {
        return 3;
    }

    if (count < 8) {
        return 4;
    }

    return 5;
}


// Builds a blank month (all-zero days) so upcoming months can be
// previewed after the current month when there's spare width, instead
// of leaving dead space in the calendar.
function buildPlaceholderMonth(year, monthIndex) {
    const monthStart = new Date(Date.UTC(year, monthIndex, 1));
    const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));
    const label = new Intl.DateTimeFormat("en", {
        month: "long",
        timeZone: "UTC",
    }).format(monthStart);

    const days = [];

    for (
        const date = new Date(monthStart);
        date <= monthEnd;
        date.setUTCDate(date.getUTCDate() + 1)
    ) {
        days.push({
            date: date.getTime(),
            total: 0,
            sources: { github: 0, leetcode: 0, roadmap: 0 },
        });
    }

    return {
        year,
        month: monthIndex + 1,
        label,
        leadingEmptyDays: monthStart.getUTCDay(),
        days,
        placeholder: true,
    };
}


function RenderMonth({
    month,
    selectedDay,
    onSelectDay,
    source,
    maxActivity,
    monthRef,
}) {
    const cells = Array.from({ length: 35 }, (_, index) => {
        const day = month.days[index];

        if (!day) {
            return (
                <span
                    key={`empty-${month.month}-${index}`}
                    className="heatmap-day heatmap-day-empty"
                    aria-hidden="true"
                />
            );
        }

        const count = getDayCount(day, source);
        const level = getActivityLevel(count, maxActivity);
        const isSelected = day.date === selectedDay?.date;
        const label = `${formatDate(day.date)}: ${count} activities`;

        if (month.placeholder) {
            return (
                <span
                    key={day.date}
                    className="heatmap-day"
                    data-level="0"
                    aria-hidden="true"
                    tabIndex={-1}
                />
            );
        }

        return (
            <button
                key={day.date}
                type="button"
                className={
                    isSelected
                        ? "heatmap-day selected"
                        : "heatmap-day"
                }
                data-level={level}
                title={label}
                aria-label={label}
                aria-pressed={isSelected}
                onClick={() => onSelectDay(day)}
            />
        );
    });

    return (
        <div
            ref={monthRef}
            className={
                month.placeholder
                    ? "heatmap-month heatmap-month--placeholder"
                    : "heatmap-month"
            }
        >
            <p className="heatmap-month-label">
                {month.label}
            </p>

            <div className="heatmap-month-grid">
                {cells}
            </div>
        </div>
    );
}


function Heatmap({
    data,
    source,
    selectedDay,
    onSelectDay,
    onSelectSource,
    renderMonths,
    maxActivity,
    totalContributions,
    totalActiveDays,
    heatmapRef,
    registerMonthRef,
}) {
    return (
        <div className="activity-heatmap-main">
            <div className="activity-heatmap-header">
                <div>
                    <p className="activity-eyebrow">
                        Contribution calendar
                    </p>

                    <h3>
                        {totalContributions.toLocaleString()} contributions
                    </h3>
                </div>

                <div className="activity-heatmap-summary">
                    <span>
                        {totalActiveDays.toLocaleString()} active days
                    </span>

                    <span>
                        {data.year}
                    </span>
                </div>
            </div>

            <nav
                className="activity-sources"
                aria-label="Activity sources"
            >
                {SOURCE_OPTIONS.map((option) => {
                    const isActive = option.key === source;

                    return (
                        <button
                            key={option.key}
                            type="button"
                            className={
                                isActive
                                    ? "activity-source active"
                                    : "activity-source"
                            }
                            aria-pressed={isActive}
                            onClick={() =>
                                onSelectSource(option.key)
                            }
                        >
                            {option.label}
                        </button>
                    );
                })}
            </nav>

            <div
                ref={heatmapRef}
                className="activity-heatmap"
                aria-label={`${data.year} activity calendar`}
            >
                {renderMonths.map((month) => (
                    <RenderMonth
                        key={`${month.year}-${month.month}`}
                        month={month}
                        selectedDay={selectedDay}
                        onSelectDay={onSelectDay}
                        source={source}
                        maxActivity={maxActivity}
                        monthRef={(el) =>
                            registerMonthRef(month.year, month.month, el)
                        }
                    />
                ))}
            </div>

            <div className="activity-legend">
                <span>Less</span>

                <div className="activity-legend-scale">
                    <span data-level="0" />
                    <span data-level="1" />
                    <span data-level="2" />
                    <span data-level="3" />
                    <span data-level="4" />
                    <span data-level="5" />
                </div>

                <span>More</span>
            </div>
        </div>
    );
}


function HeatmapInfo({ selectedDay, source }) {
    if (!selectedDay) {
        return (
            <aside className="activity-heatmap-info">
                <p className="activity-eyebrow">
                    Activity
                </p>

                <h3>
                    Select a day
                </h3>

                <p>
                    Select a day from the calendar to see
                    its activity.
                </p>
            </aside>
        );
    }

    const total = getDayCount(
        selectedDay,
        source,
    );

    return (
        <aside className="activity-heatmap-info">
            <p className="activity-eyebrow">
                Selected day
            </p>

            <h3>
                {formatDate(selectedDay.date)}
            </h3>

            <p className="activity-info-total">
                {total} activities
            </p>

            <dl className="activity-info-sources">
                {Object.entries(
                    selectedDay.sources ?? {},
                ).map(([name, count]) => (
                    <div key={name}>
                        <dt>
                            {name}
                        </dt>

                        <dd>
                            {count}
                        </dd>
                    </div>
                ))}
            </dl>
        </aside>
    );
}


function MainContainer({ data }) {
    const [source, setSource] = useState("all");
    const [availableWidth, setAvailableWidth] = useState(0);
    const heatmapRef = useRef(null);
    const monthNodesRef = useRef(new Map());

    const registerMonthRef = (year, month, el) => {
        const key = `${year}-${month}`;

        if (el) {
            monthNodesRef.current.set(key, el);
        } else {
            monthNodesRef.current.delete(key);
        }
    };

    // Real months with data, as produced by format_heatmap (already
    // includes the current month).
    const visibleMonths = useMemo(() => {
        return Array.isArray(data?.months)
            ? data.months
            : [];
    }, [data?.months]);

    const visibleDays = useMemo(() => {
        return visibleMonths.flatMap(
            (month) => month.days ?? [],
        );
    }, [visibleMonths]);

    const today = useMemo(() => {
        const now = new Date();

        return {
            timestamp: Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
            ),
            monthKey: `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`,
        };
    }, []);

    const [selectedDay, setSelectedDay] = useState(null);

    // Default the info panel to today, once today's entry is available.
    useEffect(() => {
        if (selectedDay) {
            return;
        }

        const todayEntry = visibleDays.find(
            (day) => day.date === today.timestamp,
        );

        if (todayEntry) {
            setSelectedDay(todayEntry);
        }
    }, [visibleDays, today, selectedDay]);

    // Measure the visible width of the scroll area so we know how many
    // month columns actually fit without scrolling.
    useEffect(() => {
        const el = heatmapRef.current;

        if (!el || typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setAvailableWidth(entry.contentRect.width);
            }
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    const monthsThatFit = useMemo(() => {
        if (!availableWidth) {
            return 0;
        }

        return Math.max(
            1,
            Math.floor(
                (availableWidth + MONTH_COLUMN_GAP) /
                    (MONTH_WIDTH + MONTH_COLUMN_GAP),
            ),
        );
    }, [availableWidth]);

    // If there's enough room, pad with blank upcoming months so the
    // calendar fills the available width instead of hugging the left
    // edge. If everything doesn't fit, leave it as-is (scrollable) and
    // don't add placeholders.
    const renderMonths = useMemo(() => {
        if (!visibleMonths.length) {
            return visibleMonths;
        }

        if (monthsThatFit <= visibleMonths.length) {
            return visibleMonths;
        }

        const lastReal = visibleMonths[visibleMonths.length - 1];
        const maxAvailablePadding = 12 - lastReal.month;
        const paddingCount = Math.min(
            monthsThatFit - visibleMonths.length,
            maxAvailablePadding,
        );

        if (paddingCount <= 0) {
            return visibleMonths;
        }

        const placeholders = Array.from(
            { length: paddingCount },
            (_, i) => buildPlaceholderMonth(lastReal.year, lastReal.month + i),
        );

        return [...visibleMonths, ...placeholders];
    }, [visibleMonths, monthsThatFit]);

    // On load (and whenever the set of rendered months changes), scroll
    // so the current month is the first one visible, rather than
    // whatever month happens to be last in the row.
    useEffect(() => {
        const container = heatmapRef.current;

        if (!container) {
            return;
        }

        const currentMonthEl = monthNodesRef.current.get(today.monthKey);

        if (currentMonthEl) {
            const offset =
                currentMonthEl.getBoundingClientRect().left -
                container.getBoundingClientRect().left +
                container.scrollLeft;

            container.scrollLeft = Math.max(0, offset);
        } else {
            container.scrollLeft = container.scrollWidth;
        }
    }, [renderMonths, today]);

    const maxActivity = useMemo(() => {
        return visibleDays.reduce(
            (max, day) =>
                Math.max(
                    max,
                    getDayCount(day, source),
                ),
            0,
        );
    }, [visibleDays, source]);

    const totalContributions = useMemo(() => {
        return visibleDays.reduce(
            (total, day) =>
                total + getDayCount(day, source),
            0,
        );
    }, [visibleDays, source]);

    const totalActiveDays = useMemo(() => {
        return visibleDays.reduce(
            (total, day) =>
                total +
                (getDayCount(day, source) > 0 ? 1 : 0),
            0,
        );
    }, [visibleDays, source]);

    return (
        <div className="activityMainContainer">
            <Heatmap
                data={data}
                source={source}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onSelectSource={setSource}
                renderMonths={renderMonths}
                maxActivity={maxActivity}
                totalContributions={totalContributions}
                totalActiveDays={totalActiveDays}
                heatmapRef={heatmapRef}
                registerMonthRef={registerMonthRef}
            />

            <HeatmapInfo
                selectedDay={selectedDay}
                source={source}
            />
        </div>
    );
}


function ActivitySection() {
    const data = useSite("heatmap");

    return (
        <section id="activitysection" className="activity-section container" >
            <Heading
                title={
                    data?.data?.label ?? "Activity"
                }
                description="Everything I have been building, learning and contributing to, collected in one place."
            />
            <SectionErrorBoundary name="Current projects">
                <ResourceState
                    data={data}
                    render={(data) => (
                        <MainContainer
                            data={format_heatmap(data)}
                        />
                    )}
                />
            </SectionErrorBoundary>
        </section>
    );
}


export default ActivitySection;