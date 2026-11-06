# Assistant-reviewed research feed

The website reads the published `feed.json`. It does not scrape sources or call an LLM in visitors' browsers. Categories remain paper (论文), news (资讯), and project (有趣项目), with local search and shareable filters.

## One research schedule, one publishing route

The owner's assistant researches public sources, selects relevant work, reads the original material, writes concise Chinese summaries with explicit limitations, and reviews evidence before submitting a complete content package. No raw RSS or GitHub-topic result can overwrite reviewed content. The old collector, scheduled-refresh template and refresh helper have been removed.

The research automation is configured by the assistant outside this repository. **No schedule is created by these files.** Use one research automation only, not a second GitHub cron. Publication permission does not mean a schedule has already been configured or that this branch is live.

The automated task updates only `content/feed.json` on source branch `main`, using the current file SHA/branch head to avoid overwriting newer work. A normal main push triggers the existing deploy workflow. Deployment checks out the previous published state, validates the candidate against it, runs tests and a production build, and only then updates `master` and requests a Pages build. Shared concurrency prevents parallel publishes. The workflow removes an obsolete `feed-refresh.yml` scheduler from the generated branch if it had been installed.

`public/feed.json` is the generated browser payload, not the authoring interface. The first package contains five genuinely researched items; test fixtures are under `tests/fixtures` and must never be published.

## Exact content package

Required root fields:
- `schemaVersion`: 2.
- `mode`: `assistant-reviewed`.
- `updatedAt`: ISO 8601 timestamp with timezone, no earlier than review.
- `review`: `{ "status": "reviewed", "method": "primary-source-review", "reviewedAt": "2026-11-06T03:36:10Z" }`.
- `items`: 1–150 items total, at most 50 per category. Empty packages are rejected.

Every item requires:
- `id`: stable unique string, max 200 characters.
- `category`: `paper`, `news`, or `project`.
- `title`: plain text, max 300 characters.
- `url`: public HTTPS canonical original-source link.
- `source`: readable source name, max 150 characters.
- `summary`: Chinese research summary, max 1400 characters. Preserve reading scope, limitations and whether figures are author-reported; do not imply reproduction.
- `whyRelevant`: topic relevance, max 700 characters. Do not expose private user context.
- `publishedAt`: source-precision date (`YYYY-MM`, `YYYY-MM-DD`) or timezone-aware timestamp. A month-only date is shown explicitly without inventing a day.
- `verifiedAt`: timezone-aware ISO timestamp when the evidence was checked; no later than review.
- `summaryType`: exactly `研究整理`.
- `evidenceUrls`: 1–8 public HTTPS original-evidence links, including the primary `url`.
- Optional `updatedAt`: source's actual item/repository update timestamp, no later than verification.

The validator checks structure, chronology, public-link shape, duplicate IDs/canonical URLs, length limits, plain text and common secret patterns. It does **not** prove factual accuracy, inspect destination content or guarantee privacy. The research assistant must verify the actual sources, check claims and licences, avoid prompt injections and private information, and reconcile links before marking the package reviewed. The review label is process metadata, not a cryptographic signature.

## Research task integration contract

1. Read current `content/feed.json` from `main` and relevant public primary sources.
2. Research topics such as robotics, VLA/VLN, EQA, semantic mapping, SLAM, world models and agents. Prefer useful, substantiated findings over filling quotas; do not fabricate new items when no worthwhile update exists.
3. Produce the complete replacement package. Retain useful older entries when appropriate; this is not an append-only archive. Reconcile duplicate papers/repositories manually, preserving source precision and caveats.
4. Review facts, evidence, publication dates, summaries and privacy. Use a fresh review/update timestamp only for a real reviewed package.
5. Run `python3 scripts/prepare_feed.py candidate.json --output /tmp/validated-feed.json --previous previous.json` and the unit tests. If blocked or uncertain, do not publish; report the problem and keep the existing site.
6. Update `content/feed.json` on `main` through the authorized connector with the current blob SHA. If the write lease fails, reread and reconcile; do not force overwrite.
7. Check the exact resulting commit's Deploy workflow and Pages result. A successful repository write is not a verified live update. If deployment fails, report it; do not claim publication succeeded.

## Failure safety and rollback

Validation fails closed for empty/unreviewed/invalid/older packages. It completes before staging and uses an atomic local replacement. The existing remote site remains untouched if validation, tests or build fails before the publish step. Previous versions remain in Git history. If Pages fails after the generated branch was updated, the old content remains recoverable, but deployment is not verified; inspect Pages before reporting success.

To recover after a bad accepted release, restore a known-good package's content through the same reviewed publication route with a fresh review timestamp after rechecking it, or use an explicitly authorized commit revert. Do not silently bypass the stale-package guard. Failures never fall back to unreviewed scraping.

## Tests and state

```
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/prepare_feed.py content/feed.json
npm run build
git diff --check
```

The branch QA workflow runs actual Chromium interaction tests and 320/375px checks, uploads screenshots, and verifies an invalid package leaves published bytes unchanged. It does not publish. The research automation, main merge, and live Pages verification are separate activation steps.
