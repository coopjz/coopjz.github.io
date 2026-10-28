import { Link, Navigate, useParams } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { getPost } from '../lib/posts';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  // 无效 slug 回退到列表页
  if (!post) return <Navigate to="/blog" replace />;

  return (
    <article className="page post-page">
      <Link to="/blog" className="back-link">
        ← All posts
      </Link>
      <h1 className="post-title">{post.title}</h1>
      <div className="post-meta">
        {post.date}
        {post.tags.length > 0 && (
          <span className="post-tags">
            {post.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </span>
        )}
      </div>
      <MarkdownRenderer markdown={post.content} />
    </article>
  );
}
