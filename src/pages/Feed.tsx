import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type Category = 'all' | 'paper' | 'news' | 'project';
type Item = { id: string; title: string; url: string; summary: string; category: Category; source: string; publishedAt: string; updatedAt?: string; summaryType: string };
type FeedData = { updatedAt: string | null; items: Item[]; sources: { name: string; status: string; checkedAt?: string }[] };
const categories: [Category, string][] = [['all', '全部'], ['paper', '论文'], ['news', '资讯'], ['project', '有趣项目']];
const date = (value: string) => new Date(value).toLocaleDateString('zh-CN');
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
      .then(value => { if (!Array.isArray(value.items) || !Array.isArray(value.sources)) throw new Error('Invalid feed'); setData(value); })
      .catch(e => { if (e.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [attempt]);
  const items = (data?.items ?? []).filter(item => safe(item.url) && (category === 'all' || item.category === category) && `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="feed" lang="zh-CN">
    <p className="feed-eyebrow">~/feed</p><h1>Research feed</h1>
    <p className="feed-intro">机器人、空间智能与 Agent 的论文、资讯和开源项目。摘要来自原始来源，不是 AI 生成的评论。</p>
    <div className="feed-controls" aria-label="内容分类">{categories.map(([key, label]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => { if (category !== key) setParams(key === 'all' ? {} : { type: key }); }}>{label}</button>)}</div>
    <label className="feed-search">搜索标题、摘要或来源<input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="例如 navigation / world model" /></label>
    {error ? <p role="alert">暂时无法读取 feed。<button onClick={() => setAttempt(attempt + 1)}>重试</button></p> : !data ? <p role="status">正在读取…</p> : <>
      <p className="feed-meta">{data.updatedAt ? `最近抓取：${new Date(data.updatedAt).toLocaleString('zh-CN')} · ` : ''}{items.length} 条内容 · 自动筛选，非人工推荐</p>
      {data.sources.some(s => s.status !== 'ok') && <p className="feed-warning" role="status">部分来源暂时不可用，保留其上次成功抓取的内容：{data.sources.filter(s => s.status !== 'ok').map(s => s.name).join('、')}。</p>}
      {!items.length && <p className="feed-empty">{data.items.length ? '没有匹配内容，试试其他分类或关键词。' : '暂无内容。首次成功抓取后将在这里显示真实来源的信息。'}</p>}
      <div className="feed-items">{items.map(item => <article key={item.id} className="feed-card"><div className="feed-meta">{categories.find(([key]) => key === item.category)?.[1]} · {item.source} · <time dateTime={item.publishedAt}>{date(item.publishedAt)}</time>{item.category === 'project' ? ' 创建' : ' 发布'}</div><h2><a href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a></h2><p>{item.summary || '来源未提供摘要。'}</p><div className="feed-meta">{item.summaryType}{item.updatedAt ? ` · 仓库更新 ${date(item.updatedAt)}` : ''}</div></article>)}</div>
    </>}
    <p className="feed-meta">公开来源：arXiv cs.RO、Hugging Face Blog、Google DeepMind、GitHub。项目按机器人主题和最近更新筛选，不代表质量排名。</p>
  </section>;
}
