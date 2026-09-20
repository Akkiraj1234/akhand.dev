function DefaultLoading() {
    return (
        <div className="resource-state-message resource-state-loading">
            <span
                className="resource-state-indicator"
                aria-hidden="true"
            />
            <span>Data is being loaded...</span>
        </div>
    );
}

function DefaultError({ error }) {
    return (
        <div
            className="resource-state-message resource-state-error"
            role="alert"
        >
            <span className="resource-state-label">
                Unable to load data
            </span>

            <span className="resource-state-detail">
                Please try again later.
            </span>
        </div>
    );
}

function RenderWarning({ render, data }) {
    return (
        <>
            {render(data.data)}

            <p className="resource-state-warning" role="status">
                Unable to refresh data.
            </p>
        </>
    );
}

function ResourceState({
    data,
    render,
    renderLoading = DefaultLoading,
} = {}) {
    /*
    Render a resource according to its current loading and data state.

    `data` is the resource state provided by the site data layer. The
    component maps that state to one of four UI outcomes:

    - loading: render the loading state
    - error: render the error state when no usable data is available
    - ready + error: render the available data with a refresh warning
    - ready: render the available resource data

    The resource renderer is only called when usable data is available.
    Loading and error states are handled by ResourceState itself, keeping
    resource components focused only on rendering their actual data.

    `renderLoading` may be provided when a resource needs custom loading UI.
    Otherwise, the default loading state is rendered.

    The consuming component is responsible for subscribing to resource
    state changes through `useSite`, allowing ResourceState to re-render
    whenever the resource state changes.
    */

    const loadStatus = data?.["site-load-status"] ?? "loading";
    const dataStatus = data?.["site-data-status"] ?? "old";

    if (loadStatus === "loading") {
        return (
            <div className="resource-state">
                {renderLoading()}
            </div>
        );
    }

    if (loadStatus === "error") {
        return (
            <div className="resource-state">
                <DefaultError error={data?.data} />
            </div>
        );
    }

    if (dataStatus === "error") {
        return (
            <div className="resource-state">
                <RenderWarning
                    render={render}
                    data={data}
                />
            </div>
        );
    }

    return (
        <div className="resource-state">
            {render(data.data)}
        </div>
    );
}

export default ResourceState