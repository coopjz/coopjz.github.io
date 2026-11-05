# Research feed

The navigation's Feed link opens `/#/feed`. Filters are shareable (`/#/feed?type=paper`, `news`, `project`) and follow browser Back/Forward. Search is local to the downloaded public feed.

## Real data, no generated summaries

`scripts/update_feed.py` fetches arXiv cs.RO RSS, Hugging Face Blog RSS, Google DeepMind RSS and GitHub's public robotics-topic repository search. RSS entries are keyword-filtered for robotics, navigation, embodied/spatial intelligence, SLAM, world models, semantic maps and agents. This is a simple topic filter, not semantic ranking or expert curation. Hugging Face Papers is not yet a data source.

Cards show the original title, HTTPS source link, source-supplied abstract excerpt or repository description, publication/creation date, and repository update date where applicable. No LLM or API key is required. Only the GitHub Actions token is used for public API rate limits, never included in output. Repository selection requires more than 20 stars and excludes archived repositories. This does not imply quality endorsement.

Items are deduplicated by canonical URL, including arXiv version suffix removal. Up to 50 entries per category are retained. Cross-source semantic/paper-repository matching is not claimed.

## Refresh and fallback

Each normal deployment or manual dispatch of the existing Deploy to GitHub Pages workflow copies `master`'s last published `feed.json`, refreshes sources, runs parser tests, then builds and deploys. A source failure preserves that source's old entries and marks them stale. A first-run source failure has no fabricated fallback data. UI displays an honest empty state or warning.

No daily schedule has been enabled. GitHub cron workflows run on the default branch, which is currently `master`, while this repository keeps workflow source on `main`. Merely adding a cron trigger on `main` would not work. A future schedule can use an authorized external scheduler to dispatch the existing workflow on `main`; setup and publication require separate review. Do not change the repository's default branch silently.

## Checks

```
python3 scripts/update_feed.py
python3 -m unittest discover -s scripts -p 'test_*.py'
npm run build
git diff --check
```

Publishing source to `main` automatically deploys to `master`; use a feature branch for review. Do not edit generated files on `master` manually.
