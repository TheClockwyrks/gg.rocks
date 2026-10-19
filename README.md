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

The docs section, `/docs`, presents gg's documentation pages: the `docs/`
folder of the `gg` repository at the version `apps/web/gg-docs.json` pins.
Before a build or a dev server, `scripts/gg-docs.sh` fetches that version's
pages from the tag `v<version>` of the public mirror,
[TheClockwyrks/gg](https://github.com/TheClockwyrks/gg), into
`apps/web/.gg-docs/`, and the build renders each page at
`/docs/<path>/`. A link from one of gg's pages to another moves under
`/docs/`, and a link to any other page of The Test Cabinet's documentation
goes to <https://docs.testcabinet.ai>. Presenting a newer gg release is a
change of the pin.

To build from other pages, such as gg's unreleased ones in the superrepo,
`GG_DOCS_DIR` names their folder, relative to this repository's root, and
nothing is fetched:

```sh
GG_DOCS_DIR=../gg/docs npm run dev -w apps/web
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
