# gg.rocks

gg's public site.

This repository is one component of
[The Test Cabinet](https://github.com/TheClockwyrks/TheTestCabinet). What it is
and how it fits with the others is stated by the documentation site, which
lives in the superrepo at `apps/docs/src/content/docs/`. Its Repositories page,
`apps/docs/src/content/docs/development/repositories.md`, draws the edges
between the repositories.

## Getting started

Open the superrepo in its devcontainer, which carries every toolchain the
repositories need, and work from this repository's root.

One command runs every gate:

```sh
make gate
```

Each gate is a file under `ci/gates/` whose stem is the gate's id.
`uv run --quiet --project ci gate list` names them all, and
`azure-pipelines.yml` runs each one as a step of its own on every push, inside
the CI images the superrepo builds.

## The site

The site is a Vite and React app, `apps/web`, the npm workspace's one member.
From this repository's root:

```sh
npm ci
npm run dev -w apps/web     # a dev server on port 5175
npm run build -w apps/web   # the static site, into apps/web/dist/
```

The benchmarks and experiments pages chart figures the scripts under
[`scripts/run-data/`](scripts/run-data/README.md) write into `run-data/` from
The Test Cabinet's runs; the site bundles them at build time.

## Deploying

The pipeline's `deploy` stage (`.azure/project/stages.yml`) runs
`scripts/ci/deploy-site.sh` on every `master` and `staging` build that passed
the gates: `master` deploys to the Cloudflare Pages project `gg-rocks`, served
at `gg.rocks`, and `staging` to `gg-rocks-staging`, served at
`staging.gg.rocks`. The superrepo's Releasing page,
`apps/docs/src/content/docs/development/releasing.md`, section "gg.rocks
(Cloudflare Pages, one-time)", says how the projects and the pipeline's
Cloudflare variables are set up.
