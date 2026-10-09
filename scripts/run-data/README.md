# Run data

These scripts turn runs on The Test Cabinet into the data the site charts. Each
page has its own script, because each asks a different question:

| Page        | Question                                    | gg is set against               |
| ----------- | ------------------------------------------- | ------------------------------- |
| Benchmarks  | How does gg stand among the harnesses?      | Every other harness             |
| Experiments | Did this change to gg make it better?       | The last gg build that shipped  |

| File                      | What it does                                                         |
| ------------------------- | -------------------------------------------------------------------- |
| `gg-benchmark-data.py`    | Writes the benchmarks page's data: gg's current build and the field. |
| `gg-experiment-data.py`   | Writes one experiment's data: the build under test and its baseline. |
| `ttc.py`                  | What the two share: reading the runs and working out the figures.    |
| `gg-sample-runs.py`       | Writes invented runs, for the sample pages.                          |
| `run-data.test.sh`        | Tests the figures on a handful of hand-checked runs.                 |

All of them need only Python 3; nothing is installed.

## Reading from a backend

The deployed backends are reachable over the VPN only. The backend has to be
named, so a read never reaches production by accident.

Only GET requests are issued. Published runs are read unless `--run-state` says
otherwise; unpublished runs are still awaiting review, so their scores and
ratings may change.

Both scripts take gg's newest version among the runs as the build the figures
are for; `--current` names another.

## When the data was pulled

Every file records `pulledAt`, the moment of the pull in UTC, and both pages
show it. A pull is a snapshot: models and other harnesses keep moving, so the
figures say how things stood at that moment and nothing about later. The
directory a pull lands in is named for its date, so an earlier pull of the same
build is kept beside a later one rather than overwritten.

## Updating the benchmarks page

Run this by hand when a new build of gg ships:

```sh
scripts/run-data/gg-benchmark-data.py --env prod
scripts/run-data/gg-benchmark-data.py --env staging --run-state published,unpublished
```

It reads gg's current build only, and compares it with every other harness the
backend has runs for. If the newest gg version among the runs is an experiment
that has not shipped, name the shipped one with `--current`. It writes two
files to `run-data/benchmarks/<gg version>/<UTC date>/`:

| File             | Size         | Used for                                                                                  |
| ---------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `summary.json`   | under 1 KB   | Which build, when it was pulled and what it ran. Part of the site's own bundle.            |
| `benchmark.json` | about 120 KB | Every chart on the page. Fetched when the page is opened, so it adds nothing to the load. |

Then point the two imports in `apps/web/src/data/benchmarks.ts` at the new
directory.

## Pulling an experiment

An experiment is measured against the last gg build that **shipped**. That is
not always the version before it: a retired experiment leaves a version behind
that nothing later should be compared with. The runs do not say which builds
shipped, so the baseline has to be named:

```sh
scripts/run-data/gg-experiment-data.py --env prod --baseline 0.7.0
```

No other harness is read. It writes two files to
`run-data/experiments/<gg version>/<UTC date>/`:

| File              | Size        | Used for                                                                                   |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `summary.json`    | under 1 KB  | The experiments index and the verdict. Part of the site's own bundle.                      |
| `experiment.json` | about 65 KB | Every chart on the page. Fetched when the page is opened, so it adds nothing to the load. |

To add the page:

1. Copy `apps/web/src/data/writeUps/sampleComparison.ts`, point its two imports
   at the new directory in `run-data/`, and write the prose.
2. Add the new entry to `apps/web/src/data/writeUps/index.ts`.

Both files of a pull are committed. The runs themselves are not kept;
`--save-runs` also writes them, as `runs.json`, which `--from-runs` reads back
in place of a backend.

## How the figures are defined

The rule behind every comparison: another series is compared with gg only on
the **pairs** both ran, a pair being one model on one test case. A harness or
build that ran a stronger model, or easier cases, gets no credit for it.

- **Pass rate** is a run's checklist score. A run that did not complete scores
  zero.
- **Great or flawless** is the share of runs given one of the top two ratings.
  A run that did not complete counts against it; an unrated run is left out.
- **Cost** is the comparable cost, from the model's list price.
- Averages are taken per pair first, over its repeat runs, and then across
  pairs, so each pair counts equally.
- A **difference** is gg minus the other side over the shared pairs. Its
  interval is a 95% bootstrap over those pairs, and is not given below three.
- A gg run that failed before reporting its version is counted with the gg
  version whose runs started nearest in time, so failures are not dropped.

A comparison is only as good as the overlap. gg's runs are worth most on the
models and test case versions the other side has already run, with a few
repeats of each.

## The sample pages

The sample pages' runs are invented, and regenerate identically from a fixed
seed:

```sh
scripts/run-data/gg-sample-runs.py /tmp/sample-runs.json
scripts/run-data/gg-benchmark-data.py --from-runs /tmp/sample-runs.json --out run-data/sample/benchmark
scripts/run-data/gg-experiment-data.py --from-runs /tmp/sample-runs.json --baseline 0.7.0 --out run-data/sample/experiment
```

## Testing

```sh
scripts/run-data/run-data.test.sh
```
