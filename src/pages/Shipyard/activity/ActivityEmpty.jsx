function ActivityEmpty({ source, loading }) {
    const label =
        source === "all"
            ? "public activity"
            : `${source} activity`;

    return (
        <div className="activity-empty">
            <span
                className="activity-empty-mark"
                aria-hidden="true"
            />

            <div>
                <p className="eyebrow">
                    {loading
                        ? "Checking sources"
                        : "Nothing to plot yet"}
                </p>

                <p>
                    {loading
                        ? "Loading the latest public activity."
                        : `There is no ${label} available for this period.`}
                </p>
            </div>
        </div>
    );
}


export default ActivityEmpty;