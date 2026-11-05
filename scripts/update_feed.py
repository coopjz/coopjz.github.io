"""Build a public-source feed. No secrets or generated summaries are published."""
import datetime as dt
import email.utils
import html
import json
import os
from pathlib import Path
import re
import urllib.request
import xml.etree.ElementTree as ET

OUTPUT = Path('public/feed.json')
KEYWORDS = re.compile(r'robot|navigation|embodied|spatial|slam|world.model|vision.language.action|semantic.map|agent|VLA|VLN|EQA', re.I)
SOURCES = [
    ('arXiv cs.RO', 'paper', 'https://rss.arxiv.org/rss/cs.RO'),
    ('Hugging Face Blog', 'news', 'https://huggingface.co/blog/feed.xml'),
    ('Google DeepMind', 'news', 'https://deepmind.google/blog/rss.xml'),
]

def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]*>', ' ', value or ''))).strip()

def canonical(url):
    return re.sub(r'v\d+$', '', url.replace('http://arxiv.org/', 'https://arxiv.org/')).rstrip('/')

def read_url(url):
    headers = {'User-Agent': 'coopjz-public-research-feed/1.0', 'Accept': 'application/json, application/xml, text/xml'}
    if url.startswith('https://api.github.com/') and os.getenv('GITHUB_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as response:
        return response.read(3_000_000)

def date_iso(value):
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        try:
            parsed = email.utils.parsedate_to_datetime(value)
        except (ValueError, TypeError):
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.isoformat()

def parse_rss(data, source, category):
    root = ET.fromstring(data)
    entries = root.findall('.//item') or root.findall('{http://www.w3.org/2005/Atom}entry')
    result = []
    for entry in entries:
        def value(name):
            node = next((n for n in entry if n.tag.split('}')[-1] == name), None)
            return (node.text or node.get('href', '')) if node is not None else ''
        title = clean(value('title'))
        summary = clean(value('description') or value('summary'))
        url = canonical(value('link'))
        date = date_iso(value('pubDate') or value('published') or value('updated'))
        if not url.startswith('https://') or not date or not KEYWORDS.search(title + ' ' + summary):
            continue
        result.append(dict(id=url, url=url, title=title, summary=summary[:420], category=category, source=source, publishedAt=date, summaryType='来源摘要节选'))
    return result

def github_projects():
    url = 'https://api.github.com/search/repositories?q=topic%3Arobotics+fork%3Afalse+stars%3A%3E20&sort=updated&per_page=30'
    data = json.loads(read_url(url))
    return [dict(id=r['html_url'], url=r['html_url'], title=r['full_name'], summary=clean(r.get('description')), category='project', source='GitHub', publishedAt=r['created_at'], updatedAt=r['pushed_at'], summaryType='仓库描述') for r in data['items'] if not r.get('archived')]

def refresh():
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    old = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'items': []}
    items, statuses = [], []
    jobs = [(name, lambda name=name, category=category, url=url: parse_rss(read_url(url), name, category)) for name, category, url in SOURCES]
    jobs.append(('GitHub', github_projects))
    for name, fetch in jobs:
        try:
            current = fetch()
            if not current:
                raise ValueError('No matching items returned')
            items.extend(current)
            statuses.append(dict(name=name, status='ok', checkedAt=now))
        except Exception as error:
            items.extend(i for i in old.get('items', []) if i['source'] == name)
            previous = next((s for s in old.get('sources', []) if s['name'] == name), {})
            statuses.append(dict(name=name, status='stale', checkedAt=previous.get('checkedAt'), error=type(error).__name__))
    unique = {canonical(item['url']): item for item in items}
    items = []
    for category in ('paper', 'news', 'project'):
        items.extend(sorted((i for i in unique.values() if i['category'] == category), key=lambda i: i.get('updatedAt') or i['publishedAt'], reverse=True)[:50])
    items.sort(key=lambda i: i.get('updatedAt') or i['publishedAt'], reverse=True)
    OUTPUT.write_text(json.dumps(dict(updatedAt=now, sources=statuses, items=items), ensure_ascii=False, indent=2) + '\n')
    print(f'Feed: {len(items)} items; {sum(s["status"] == "ok" for s in statuses)}/{len(statuses)} sources refreshed')

if __name__ == '__main__':
    refresh()
