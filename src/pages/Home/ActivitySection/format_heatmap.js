
function format_heatmap(payload) {
    const providers = ["github", "leetcode", "roadmap"];

    const records = Object.fromEntries(
        providers.map((provider) => {
            const record = payload?.[provider];
            const year =
                typeof record?.year === "string"
                    ? record.year
                    : null;

            const yearData =
                year
                    ? (
                        record?.years?.[year]
                        ?? record?.data?.years?.[year]
                        ?? null
                    )
                    : null;

            return [
                provider,
                {
                    year,
                    data: yearData,
                },
            ];
        }),
    );

    const year =
        providers
            .map((provider) => records[provider].year)
            .find(Boolean) ?? null;

    if (!year) {
        return {
            year: null,
            months: [],
            days: [],
            providers: {},
        };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getUTCFullYear();
    const lastMonthIndex =
        Number(year) === currentYear
            ? Math.max(0, currentDate.getUTCMonth() - 1)
            : 11;

    const start = new Date(Date.UTC(Number(year), 0, 1));
    const end = new Date(Date.UTC(Number(year), 11, 31));
    const days = new Map();

    for (
        const date = new Date(start);
        date <= end;
        date.setUTCDate(date.getUTCDate() + 1)
    ) {
        const timestamp = date.getTime();

        days.set(timestamp, {
            date: timestamp,
            total: 0,
            sources: Object.fromEntries(
                providers.map((provider) => [provider, 0]),
            ),
        });
    }

    for (const provider of providers) {
        const heatmap = records[provider].data?.heatmap;

        if (!Array.isArray(heatmap)) {
            continue;
        }

        for (const entry of heatmap) {
            if (!entry || typeof entry.date !== "number") {
                continue;
            }

            const day = days.get(entry.date);

            if (!day) {
                continue;
            }

            const count =
                typeof entry.count === "number"
                    ? entry.count
                    : 0;

            day.sources[provider] = count;
            day.total += count;
        }
    }

    const monthEntries = Array.from(
        { length: lastMonthIndex + 1 },
        (_, monthIndex) => {
            const monthStart = new Date(Date.UTC(Number(year), monthIndex, 1));
            const monthLabel = new Intl.DateTimeFormat("en", {
                month: "long",
                timeZone: "UTC",
            }).format(monthStart);

            const monthDays = Array.from(days.values()).filter((day) => {
                const date = new Date(day.date);
                return (
                    date.getUTCFullYear() === Number(year) &&
                    date.getUTCMonth() === monthIndex
                );
            });

            return {
                year: Number(year),
                month: monthIndex + 1,
                label: monthLabel,
                leadingEmptyDays: monthStart.getUTCDay(),
                days: monthDays,
            };
        },
    );

    return {
        year,
        months: monthEntries,
        days: Array.from(days.values()),
        providers: Object.fromEntries(
            providers.map((provider) => [
                provider,
                records[provider].data
                    ? {
                        currentStreak:
                            records[provider].data.currentStreak ?? 0,

                        longestStreak:
                            records[provider].data.longestStreak ?? 0,

                        totalActiveDays:
                            records[provider].data.totalActiveDays ?? 0,

                        totalContributions:
                            records[provider].data.totalContributions ?? 0,
                    }
                    : {
                        currentStreak: 0,
                        longestStreak: 0,
                        totalActiveDays: 0,
                        totalContributions: 0,
                    },
            ]),
        ),
    };
}

export default format_heatmap