function Heading({ eyebrow, title, description }) {
    return (
        <div className="section-heading">
            <p className="eyebrow">{eyebrow}</p>

            {title && (
                <h2>{title}</h2>
            )}

            {description && (
                <p className="section-intro">
                    {description}
                </p>
            )}
        </div>
    );
}

export default Heading;