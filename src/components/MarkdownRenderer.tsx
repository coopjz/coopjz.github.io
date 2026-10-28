import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const value = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        return `<pre class="hljs"><code>${value}</code></pre>`;
      } catch {
        /* fall through to escaped output */
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

export default function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div
      className="markdown-body"
      // 内容由仓库内 Markdown 构建，可信
      dangerouslySetInnerHTML={{ __html: md.render(markdown) }}
    />
  );
}
