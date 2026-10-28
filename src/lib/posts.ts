/**
 * 博客文章加载：
 * - 文章放在 src/posts/*.md，带 YAML frontmatter（title/date/description/tags）
 * - 构建时由 Vite import.meta.glob 收集为 raw 字符串，运行时解析
 * - 自写极简 frontmatter 解析，避免 gray-matter 在浏览器端需要 Buffer polyfill
 */

export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  content: string;
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const value = kv[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      data[key] = value;
    }
  }
  return { data, body: match[2] };
}

const modules = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const posts: Post[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw);
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    return {
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? ''),
      description: String(data.description ?? ''),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      content: body,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
