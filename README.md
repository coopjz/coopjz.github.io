# coopjz.github.io

Junzhe Wang's personal homepage. React + Vite + TypeScript, with an interactive terminal and an English profile.

## Local development

```bash
npm ci
npm run dev
npm run build
npm run preview
```

Edit basic profile information in `src/config.ts`. Blog pages and Markdown articles are retained; `features.blog` is currently `false`.

## Deployment

Source code lives on `main`. Push to `main` to build the site and publish the generated static files to `master`, the repository's existing GitHub Pages source branch. The workflow requests a Pages build after publishing. Previous site versions remain available in Git history.

For the complete development and deployment guide, see [`docs/DEVELOPMENT_AND_DEPLOYMENT.md`](docs/DEVELOPMENT_AND_DEPLOYMENT.md).

Live site: https://coopjz.github.io/
