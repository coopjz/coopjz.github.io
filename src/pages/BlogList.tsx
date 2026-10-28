import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { posts } from '../lib/posts';

export default function BlogList() {
  return (
    <div className="page">
      <h1 className="page-title">
        <span className="prompt-char">$</span> ls ~/blog
      </h1>
      {posts.length === 0 ? (
        <p className="about-p">还没有文章，去 src/posts/ 下写一篇 Markdown 吧。</p>
      ) : (
        <div className="post-grid">
          {posts.map((post) => (
            <Reveal key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="post-card">
                <span className="post-card-arrow" />
                <span className="post-card-title">{post.title}</span>
                <span className="post-card-meta">
                  {post.date}
                  {post.tags.length > 0 && ` · ${post.tags.join(' / ')}`}
                </span>
                <span className="post-card-desc">{post.description}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
