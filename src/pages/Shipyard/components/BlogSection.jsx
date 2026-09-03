import site from "../../../data/site";

import Heading from "./Heading";


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
                {site.blog.map((post) => (
                    <article key={post.title}>
                        <div>
                            <p className="eyebrow">
                                {post.date}
                            </p>

                            <h3>
                                {post.title}
                            </h3>

                            <p>
                                {post.description}
                            </p>
                        </div>

                        <p className="tags">
                            {post.tags.join(" / ")}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}


export default BlogSection;