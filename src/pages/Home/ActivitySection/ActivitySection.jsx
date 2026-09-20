import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import Heading from "@/components/Heading";
import ResourceState from "@/components/ResourceState";
import useSite from "@/hooks/useSite";

import format_heatmap from "./format_heatmap";
import "./activitysection.css";


const SOURCE_OPTIONS = [
    { key: "all", label: "All" },
    { key: "github", label: "GitHub" },
    { key: "leetcode", label: "LeetCode" },
    { key: "roadmap", label: "Roadmap" },
];


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


function RenderMonth({
    month,
    selectedDay,
    onSelectDay,
    source,
    maxActivity,
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
                aria-label={`${formatDate(day.date)}: ${count} activities`}
                aria-pressed={isSelected}
                onClick={() => onSelectDay(day)}
            />
        );
    });

    return (
        <div className="heatmap-month">
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
    visibleMonths,
    maxActivity,
    totalContributions,
    totalActiveDays,
    heatmapRef,
}) {
    return (
        <div className="activity-heatmap-main">
            <div className="activity-heatmap-header">
                <div>
                    <p className="activity-eyebrow">
                        Contribution calendar
                    </p>

                    <h3>
                        {totalContributions} contributions
                    </h3>
                </div>

                <div className="activity-heatmap-summary">
                    <span>
                        {totalActiveDays} active days
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
                {visibleMonths.map((month) => (
                    <RenderMonth
                        key={`${month.year}-${month.month}`}
                        month={month}
                        selectedDay={selectedDay}
                        onSelectDay={onSelectDay}
                        source={source}
                        maxActivity={maxActivity}
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
    const [selectedDay, setSelectedDay] = useState(null);
    const [source, setSource] = useState("all");
    const heatmapRef = useRef(null);

    const visibleMonths = useMemo(() => {
        return Array.isArray(data?.months)
            ? data.months
            : [];
    }, [data?.months]);

    useEffect(() => {
        if (!heatmapRef.current) {
            return;
        }

        heatmapRef.current.scrollLeft = heatmapRef.current.scrollWidth;
    }, [visibleMonths.length, source]);

    const visibleDays = useMemo(() => {
        return visibleMonths.flatMap(
            (month) => month.days ?? [],
        );
    }, [visibleMonths]);

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
                visibleMonths={visibleMonths}
                maxActivity={maxActivity}
                totalContributions={totalContributions}
                totalActiveDays={totalActiveDays}
                heatmapRef={heatmapRef}
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
        <section
            id="activitysection"
            className="activity-section container"
        >
            <Heading
                title={
                    data?.data?.label ?? "Activity"
                }
                description="Everything I have been building, learning and contributing to, collected in one place."
            />

            <ResourceState
                data={data}
                render={(data) => (
                    <MainContainer
                        data={format_heatmap(data)}
                    />
                )}
            />
        </section>
    );
}


export default ActivitySection;