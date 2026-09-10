import { Component } from "preact";

class SectionErrorBoundary extends Component {
    state = { hasError: false };

    componentDidCatch() {
        this.setState({ hasError: true });
    }

    render({ children, name = "This section" }, { hasError }) {
        if (hasError) {
            return (
                <section className="section-error" role="status">
                    {name} is temporarily unavailable. The rest of the site is still available.
                </section>
            );
        }

        return children;
    }
}

export default SectionErrorBoundary;
