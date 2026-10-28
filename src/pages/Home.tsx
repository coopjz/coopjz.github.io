import { Link } from 'react-router-dom';
import Terminal from '../components/Terminal';
import Reveal from '../components/Reveal';
import { site } from '../config';
import { posts } from '../lib/posts';

export default function Home() {
  const latest = posts.slice(0, 3);
  return (
    <div className="home">
      <section className="hero">
        <Terminal />
        <p className="hero-tagline">{site.owner.tagline}</p>
      </section>

      <Reveal className="section">
        <h2 className="section-title">
          <span className="prompt-char">$</span> cat about.md
        </h2>
        {site.owner.about.map((p, i) => (
          <p key={i} className="about-p">
            {p}
          </p>
        ))}
      </Reveal>

      {latest.length > 0 && (
        <Reveal className="section">
          <h2 className="section-title">
            <span className="prompt-char">$</span> ls ~/blog | head -3
          </h2>
          <div className="post-grid">
            {latest.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="post-card">
                <span className="post-card-arrow" />
                <span className="post-card-title">{post.title}</span>
                <span className="post-card-meta">
                  {post.date}
                  {post.tags.length > 0 && ` · ${post.tags.join(' / ')}`}
                </span>
                <span className="post-card-desc">{post.description}</span>
              </Link>
            ))}
          </div>
          <Link to="/blog" className="more-link">
            $ cd ~/blog →
          </Link>
        </Reveal>
      )}
    </div>
  );
}
