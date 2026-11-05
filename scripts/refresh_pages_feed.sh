#!/usr/bin/env bash
# Run from the source checkout. Only feed.json is written in the Pages checkout.
set -euo pipefail
pages_dir="${1:?Pass the Pages checkout directory}"
test -d "$pages_dir/.git"
if [ -f "$pages_dir/feed.json" ]; then cp "$pages_dir/feed.json" public/feed.json; fi
python3 scripts/update_feed.py
python3 - <<'PY'
import json
feed = json.load(open('public/feed.json'))
assert feed['items'], 'Refusing to publish an empty feed'
assert any(s['status'] == 'ok' for s in feed['sources']), 'All sources failed; leave published feed untouched'
assert all(i['url'].startswith('https://') for i in feed['items'])
PY
cp public/feed.json "$pages_dir/feed.json"
