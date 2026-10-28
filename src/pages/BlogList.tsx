import { Link } from 'react-router-dom';
import { posts } from '../lib/posts';

export default function BlogList() {
  return (
    <div className="page blog-page">
      <div className="blog-heading"><div><h1 className="page-title">Writing<span className="name-period">.</span></h1><p className="page-description">Notes on research, code, and things I build.</p></div></div>
      {posts.length === 0 ? <p className="about-p">The first post is on its way.</p> : <div className="post-grid">{posts.map((post, index) => <Link key={post.slug} to={`/blog/${post.slug}`} className="post-card"><span className="post-number">{String(index + 1).padStart(2, '0')}</span><div className="post-card-content"><span className="post-card-meta"><time dateTime={post.date}>{post.date}</time>{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</span><h2 className="post-card-title">{post.title}</h2><p className="post-card-desc">{post.description}</p></div><span className="post-card-link" aria-hidden="true">↗</span></Link>)}</div>}
    </div>
  );
}
