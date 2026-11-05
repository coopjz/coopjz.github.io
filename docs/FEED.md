# Research feed

The navigation's Feed link opens `/#/feed`. Filters are shareable (`/#/feed?type=paper`, `news`, `project`) and follow browser Back/Forward. Search is local to the downloaded public feed.

## Real data, no generated summaries

`scripts/update_feed.py` fetches arXiv cs.RO RSS, Hugging Face Blog RSS, Google DeepMind RSS and GitHub's public robotics-topic repository search. RSS entries are keyword-filtered for robotics, navigation, embodied/spatial intelligence, SLAM, world models, semantic maps and agents. This is a simple topic filter, not semantic ranking or expert curation. Hugging Face Papers is not yet a data source.

Cards show the original title, HTTPS source link, source-supplied abstract excerpt or repository description, publication/creation date, and repository update date where applicable. No LLM or API key is required. Only the GitHub Actions token is used for public API rate limits, never included in output. Repository selection requires more than 20 stars and excludes archived repositories. This does not imply quality endorsement.

Items are deduplicated by canonical URL, including arXiv version suffix removal. Up to 50 entries per category are retained. Cross-source semantic/paper-repository matching is not claimed.

## Refresh and fallback

Each normal deployment or manual dispatch of the existing Deploy to GitHub Pages workflow copies `master`'s last published `feed.json`, refreshes sources, runs parser tests, then builds and deploys. A source failure preserves that source's old entries and marks them stale. A first-run source failure has no fabricated fallback data. UI displays an honest empty state or warning.

The daily scheduler is prepared in `.github/scheduled/feed-refresh.yml`, but **not installed or active**. After release and explicit activation, install this template as `.github/workflows/feed-refresh.yml` on `master`, the unchanged default branch. It runs daily at 03:17 UTC (11:17 Hong Kong), reads the source script from `main`, and updates only `master/feed.json`. It shares the deployment concurrency lock. The normal deployment preserves `.github/**` so it cannot erase the scheduler. No PAT or third-party scheduler is needed.

Activation must wait until the feature is released. Installing the workflow requires a workflow-authorized connector/user action; do not assume the Actions token can create workflow files. After installation, run a manual workflow dispatch, verify the resulting commit and Pages build, then verify the first scheduled run. These live steps have not been performed because the website must remain unpublished.

The refresh helper refuses to publish empty data or a result where all sources failed. Individual-source failures retain earlier content. CI dry-runs the same helper against a temporary Pages checkout and asserts only `feed.json` changed; it also verifies deployment cleanup retains the scheduler. GitHub scheduled runs may be delayed or dropped during load, and public-repository schedules may be disabled after 60 days without activity. This is daily best-effort refresh, not a real-time SLA. See https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule.

## Checks

```
python3 scripts/update_feed.py
python3 -m unittest discover -s scripts -p 'test_*.py'
npm run build
git diff --check
```

Publishing source to `main` automatically deploys to `master`; use a feature branch for review. Do not edit generated files on `master` manually.
