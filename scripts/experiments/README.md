# Experiment data

These scripts turn runs on The Test Cabinet into the data an experiment
write-up on the site is drawn from. Run them when there is a new gg version to
write about, before pushing the page.

| File                         | What it does                                                    |
| ---------------------------- | --------------------------------------------------------------- |
| `gg-experiment-data.py`      | Reads the runs from a backend and writes one experiment's data. |
| `gg-experiment-sample.py`    | Writes invented runs, for the sample page.                      |
| `gg-experiment-data.test.sh` | Tests the figures on a handful of hand-checked runs.            |

All three need only Python 3; nothing is installed.

## Pulling an experiment

The deployed backends are reachable over the VPN only. The backend has to be
named, so a read never reaches production by accident.

```sh
scripts/experiments/gg-experiment-data.py --env prod
scripts/experiments/gg-experiment-data.py --env staging --run-state published,unpublished
```

Only GET requests are issued. Published runs are read unless `--run-state` says
otherwise; unpublished runs are still awaiting review, so their scores and
ratings may change.

The script takes gg's newest version among the runs as the build under test and
the next newest as its baseline (`--current` and `--previous` override this),
and compares it with every other harness the backend has runs for. It writes
two files to `run-data/<gg version>/<UTC date>/`:

| File              | Size        | Used for                                                                                       |
| ----------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `summary.json`    | under 1 KB  | The experiments index and the verdict. Part of the site's own bundle.                          |
| `experiment.json` | about 150 KB | Every chart on the page. Fetched when the page is opened, so it adds nothing to the first load. |

Both are committed. The runs themselves are not kept; `--save-runs` also writes
them, as `runs.json`, which `--from-runs` reads back in place of a backend.

## Adding the page

1. Copy `apps/web/src/data/writeUps/gg070Field.ts`, point its two imports at
   the new directory in `run-data/`, and write the prose.
2. Add the new entry to `apps/web/src/data/writeUps/index.ts`.

## How the figures are defined

The rule behind every comparison: a harness is compared with gg only on the
**pairs** both ran, a pair being one model on one test case. A harness that ran
a stronger model, or easier cases, gets no credit for it.

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

The comparison is only as good as the overlap. gg's runs are worth most on the
models and test case versions the other harnesses have already run, with a few
repeats of each.

## The sample page

The sample page's runs are invented, and regenerate identically from a fixed
seed:

```sh
scripts/experiments/gg-experiment-sample.py /tmp/sample-runs.json
scripts/experiments/gg-experiment-data.py --from-runs /tmp/sample-runs.json --out run-data/sample
```

## Testing

```sh
scripts/experiments/gg-experiment-data.test.sh
```
