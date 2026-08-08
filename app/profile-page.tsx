import { siteContent } from "./site-content";

type ProfilePageProps = {
  onReturn: () => void;
};

export default function ProfilePage({ onReturn }: ProfilePageProps) {
  const { identity, links, about, currentQuestion, news, publications, research, products, creative } = siteContent;

  return (
    <section className="profile-page" aria-label="Personal profile">
      <button className="profile-fold" type="button" onClick={onReturn} aria-label="Return to the 3D atlas">
        <span>EXPLORE</span>
      </button>

      <main className="profile-shell">
        <header className="profile-header">
          <div className="profile-portrait" aria-label="Portrait placeholder">
            {identity.initials}
            <small>ADD PHOTO</small>
          </div>
          <div className="profile-intro">
            <p className="profile-kicker">PERSONAL PROFILE · 2026</p>
            <h1>{identity.name}</h1>
            <p className="profile-role">{identity.role}</p>
            <p className="profile-location">{identity.location}</p>
            <nav className="profile-links" aria-label="External links">
              {links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
              <a href={`mailto:${identity.email}`}>Email</a>
            </nav>
          </div>
        </header>

        <section className="profile-section profile-about" id="about">
          <p className="section-index">01</p>
          <div>
            <h2>About</h2>
            {about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="research-question"><strong>Current question</strong> {currentQuestion}</p>
          </div>
        </section>

        <section className="profile-section" id="news">
          <p className="section-index">02</p>
          <div>
            <h2>News</h2>
            <div className="news-list">
              {news.map((item) => (
                <article key={`${item.date}-${item.text}`}>
                  <time>{item.date}</time>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-section" id="publications">
          <p className="section-index">03</p>
          <div>
            <h2>Selected Publications</h2>
            <div className="publication-list">
              {publications.map((paper) => (
                <article key={paper.title}>
                  <p className="publication-year">{paper.year}</p>
                  <div>
                    <h3>{paper.title}</h3>
                    <p>{paper.authors}</p>
                    <p><em>{paper.venue}</em></p>
                    <div className="inline-links">
                      {paper.links?.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-section" id="research">
          <p className="section-index">04</p>
          <div>
            <h2>Research</h2>
            <div className="project-grid">
              {research.map((project) => (
                <article key={project.title}>
                  <span>{project.status}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-section" id="products">
          <p className="section-index">05</p>
          <div>
            <h2>Products & Open Source</h2>
            <div className="project-grid">
              {products.map((project) => (
                <article key={project.title}>
                  <span>BUILD</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  {project.href && <a href={project.href}>View project →</a>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-section" id="creative">
          <p className="section-index">06</p>
          <div>
            <h2>Creative Work</h2>
            <div className="creative-list">
              {creative.map((item) => (
                <article key={item.category}>
                  <p>{item.category}</p>
                  <h3>{item.title}</h3>
                  <span>{item.note}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="profile-footer">
          <p>There is more to discover in the three-dimensional atlas.</p>
          <button type="button" onClick={onReturn}>Return to the cosmos</button>
        </footer>
      </main>
    </section>
  );
}
