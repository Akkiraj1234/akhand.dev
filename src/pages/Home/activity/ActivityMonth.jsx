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
                {formatDate(
                    `${month.year}-${String(
                        month.month
                    ).padStart(2, "0")}-01`
                ).replace(
                    " 1, ",
                    " "
                )}
            </div>

            <div
                className="activity-month-grid"
                role="grid"
                aria-label={`${formatDate(
                    `${month.year}-${String(
                        month.month
                    ).padStart(2, "0")}-01`
                ).replace(
                    " 1, ",
                    " "
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


export default ActivityMonth;