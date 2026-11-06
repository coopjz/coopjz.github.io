import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type Category = 'all' | 'paper' | 'news' | 'project';
type Item = { id: string; title: string; url: string; summary: string; category: Category; source: string; publishedAt: string; updatedAt?: string; summaryType: string; verifiedAt: string; whyRelevant: string; evidenceUrls: string[] };
type FeedData = { schemaVersion: number; mode: string; updatedAt: string | null; items: Item[] };
const categories: [Category, string][] = [['all', '全部'], ['paper', '论文'], ['news', '资讯'], ['project', '有趣项目']];
const date = (value: string) => /^\d{4}-\d{2}$/.test(value) ? `${value.replace('-', '年')}月（具体日未核验）` : /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(value).toLocaleDateString('zh-CN');
const safe = (url: string) => { try { return new URL(url).protocol === 'https:'; } catch { return false; } };

export default function Feed() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('type');
  const category = categories.some(([key]) => key === selected) ? selected : 'all';
  const [data, setData] = useState<FeedData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(`${import.meta.env.BASE_URL}feed.json`, { signal: controller.signal, cache: 'no-cache' })
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); })
      .then(value => { if (value.schemaVersion !== 2 || value.mode !== 'assistant-reviewed' || !Array.isArray(value.items)) throw new Error('Invalid feed'); setData(value); })
      .catch(e => { if (e.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [attempt]);
  const items = (data?.items ?? []).filter(item => safe(item.url) && (category === 'all' || item.category === category) && `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="feed" lang="zh-CN">
    <p className="feed-eyebrow">~/feed</p><h1>Research feed</h1>
    <p className="feed-intro">机器人、空间智能与 Agent 的论文、资讯和开源项目。由助手阅读公开来源后整理，保留核验范围与局限。</p>
    <div className="feed-controls" aria-label="内容分类">{categories.map(([key, label]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => { if (category !== key) setParams(key === 'all' ? {} : { type: key }); }}>{label}</button>)}</div>
    <label className="feed-search">搜索标题、摘要或来源<input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="例如 navigation / world model" /></label>
    {error ? <p role="alert">暂时无法读取 feed。<button onClick={() => setAttempt(attempt + 1)}>重试</button></p> : !data ? <p role="status">正在读取…</p> : <>
      <p className="feed-meta">{data.updatedAt ? `内容更新：${new Date(data.updatedAt).toLocaleString('zh-CN')} · ` : ''}{items.length} 条内容 · 助手研究整理</p>

      {!items.length && <p className="feed-empty">{data.items.length ? '没有匹配内容，试试其他分类或关键词。' : '暂无已审阅内容。研究完成并核验后将在这里发布。'}</p>}
      <div className="feed-items">{items.map(item => <article key={item.id} className="feed-card"><div className="feed-meta">{categories.find(([key]) => key === item.category)?.[1]} · {item.source} · <time dateTime={item.publishedAt}>{date(item.publishedAt)}</time> 发布</div><h2><a href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a></h2><p>{item.summary}</p><p><strong>为什么关注：</strong>{item.whyRelevant}</p><div className="feed-meta">{item.summaryType} · 核验 {date(item.verifiedAt)}{item.updatedAt ? ` · 仓库更新 ${date(item.updatedAt)}` : ''}</div><div className="feed-meta">依据：{item.evidenceUrls?.filter(safe).map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">{index > 0 ? " · " : ""}原始来源 {index + 1} ↗</a>)}</div></article>)}</div>
    </>}
    <p className="feed-meta">内容依据公开原始来源，经助手筛选、阅读与整理。作者或厂商报告的结果不等于独立复现；每条注明核验范围。</p>
  </section>;
}

