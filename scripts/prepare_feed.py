"""Validate an assistant-reviewed content package and stage it atomically.

This module never fetches, ranks, summarizes, or publishes external content.
Source verification is performed by the research assistant before submission.
"""
import argparse
import datetime as dt
import hashlib
import ipaddress
import json
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit

CATEGORIES = {'paper', 'news', 'project'}

def timestamp(value, label):
    if not isinstance(value, str):
        raise ValueError(f'{label}: timestamp required')
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        raise ValueError(f'{label}: invalid ISO timestamp') from None
    if parsed.tzinfo is None:
        raise ValueError(f'{label}: timezone required')
    if parsed > dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=5):
        raise ValueError(f'{label}: future timestamp')
    return parsed

def publication_date(value):
    # Preserve source precision rather than inventing a day or time.
    if isinstance(value, str) and re.fullmatch(r'\d{4}-\d{2}', value):
        return timestamp(value + '-01T00:00:00Z', 'publishedAt')
    if isinstance(value, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        return timestamp(value + 'T00:00:00Z', 'publishedAt')
    return timestamp(value, 'publishedAt')

def public_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        raise ValueError('Invalid URL')
    parsed = urlsplit(value)
    host = parsed.hostname or ''
    if parsed.scheme != 'https' or not host or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise ValueError('Source links must be public HTTPS URLs without credentials')
    if host == 'localhost' or '.' not in host or host.endswith(('.local', '.internal', '.test', '.invalid')):
        raise ValueError('Private source URL is not allowed')
    try:
        if not ipaddress.ip_address(host).is_global:
            raise ValueError('Private source IP is not allowed')
    except ValueError as error:
        if 'Private source IP' in str(error):
            raise
    return value

def canonical(value):
    parts = urlsplit(public_url(value))
    path = parts.path.rstrip('/')
    if parts.hostname in ('arxiv.org', 'www.arxiv.org'):
        path = re.sub(r'v\d+$', '', path.replace('/pdf/', '/abs/').replace('/html/', '/abs/').removesuffix('.pdf'))
    if parts.hostname == 'github.com':
        path = path.lower().removesuffix('.git')
    return f'{parts.hostname.lower()}{path}'

def text(value, label, maximum):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f'{label}: nonempty text required (max {maximum})')
    if re.search(r'<[^>]+>', value) or any(ord(c) < 32 and c not in '\n\t' for c in value):
        raise ValueError(f'{label}: plain text only')
    if re.search(r'-----BEGIN .*PRIVATE KEY|github_pat_|ghp_[A-Za-z0-9]{20}|sk-[A-Za-z0-9]{20}', value):
        raise ValueError(f'{label}: possible secret')
    return value

def validate(data, previous=None):
    if not isinstance(data, dict) or data.get('schemaVersion') != 2 or data.get('mode') != 'assistant-reviewed':
        raise ValueError('Expected schemaVersion 2, mode assistant-reviewed')
    if set(data) - {'schemaVersion', 'mode', 'updatedAt', 'review', 'items'}:
        raise ValueError('Unexpected package fields')
    updated = timestamp(data.get('updatedAt'), 'updatedAt')
    review = data.get('review', {})
    if not isinstance(review, dict) or review.get('status') != 'reviewed' or review.get('method') != 'primary-source-review':
        raise ValueError('A completed primary-source review is required')
    if set(review) - {'status', 'method', 'reviewedAt'}:
        raise ValueError('Unexpected review fields')
    reviewed = timestamp(review.get('reviewedAt'), 'reviewedAt')
    if reviewed > updated:
        raise ValueError('updatedAt must not precede review')
    items = data.get('items')
    if not isinstance(items, list) or not 1 <= len(items) <= 150:
        raise ValueError('Publish 1–150 reviewed items; empty packages cannot replace the site')
    seen_ids, seen_urls, counts = set(), set(), {key: 0 for key in CATEGORIES}
    for item in items:
        if not isinstance(item, dict) or item.get('category') not in CATEGORIES:
            raise ValueError('Unknown item category')
        if set(item) - {'id', 'category', 'title', 'url', 'source', 'summary', 'whyRelevant', 'publishedAt', 'verifiedAt', 'summaryType', 'evidenceUrls', 'updatedAt'}:
            raise ValueError('Unexpected item fields')
        category = item['category']; counts[category] += 1
        if counts[category] > 50:
            raise ValueError('Maximum 50 items per category')
        ident = text(item.get('id'), 'id', 200)
        url = canonical(item.get('url'))
        if ident in seen_ids or url in seen_urls:
            raise ValueError('Duplicate item id or canonical URL')
        seen_ids.add(ident); seen_urls.add(url)
        for field, limit in [('title', 300), ('summary', 1400), ('source', 150), ('whyRelevant', 700)]:
            text(item.get(field), field, limit)
        if item.get('summaryType') != '研究整理':
            raise ValueError('Assistant summaries must be labelled 研究整理')
        published = publication_date(item.get('publishedAt'))
        verified = timestamp(item.get('verifiedAt'), 'verifiedAt')
        if published > verified or verified > reviewed:
            raise ValueError('Publication, verification and review times must be ordered')
        evidence = item.get('evidenceUrls')
        if not isinstance(evidence, list) or not 1 <= len(evidence) <= 8:
            raise ValueError('Provide 1–8 primary evidence URLs')
        evidence_keys = {canonical(link) for link in evidence}
        if url not in evidence_keys:
            raise ValueError('The primary item URL must be included as evidence')
        if 'updatedAt' in item and timestamp(item['updatedAt'], 'item.updatedAt') > verified:
            raise ValueError('Item update cannot be after verification')
    if previous and previous.get('mode') == 'assistant-reviewed' and previous.get('updatedAt'):
        prior = timestamp(previous['updatedAt'], 'previous.updatedAt')
        if updated < prior:
            raise ValueError('Refusing to replace a newer published package')
        if updated == prior and data != previous:
            raise ValueError('Changed content needs a new updatedAt')
    return data

def stage(candidate, output, previous_path=None):
    data = json.loads(Path(candidate).read_text(encoding='utf-8'))
    previous = json.loads(Path(previous_path).read_text(encoding='utf-8')) if previous_path and Path(previous_path).exists() else None
    validate(data, previous)
    body = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    output = Path(output); output.parent.mkdir(parents=True, exist_ok=True)
    # Validation completes before either output or the published branch is touched.
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=output.parent, delete=False) as temp:
        temp.write(body); temp_path = Path(temp.name)
    temp_path.replace(output)
    print(f'Validated {len(data["items"])} reviewed items; SHA256 {hashlib.sha256(body.encode()).hexdigest()}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('candidate')
    parser.add_argument('--output', default='public/feed.json')
    parser.add_argument('--previous')
    args = parser.parse_args()
    stage(args.candidate, args.output, args.previous)
