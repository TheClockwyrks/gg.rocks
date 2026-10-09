#!/usr/bin/env python3
"""The figures an experiment write-up charts: the gg build under test against
the last build that shipped, from The Test Cabinet's runs.

An experiment is one change to gg, built as its own version so that it can be
run. What it is measured against is the last build that SHIPPED, which is not
always the version before it: a retired experiment leaves a version behind
that nothing later should be compared with. The runs do not say which builds
shipped, so the baseline has to be named.

Usage:
    scripts/run-data/gg-experiment-data.py --env prod --baseline 0.7.0
    scripts/run-data/gg-experiment-data.py --env staging --baseline 0.7.0 --run-state published,unpublished
    scripts/run-data/gg-experiment-data.py --from-runs /tmp/runs.json --baseline 0.7.0 --out run-data/sample/experiment

The newest gg version among the runs is taken as the build under test
(--current names another). Nothing else is read, neither gg's other versions
nor any other harness: how gg stands against those is the benchmarks page (see
gg-benchmark-data.py). Two files land in
run-data/experiments/<gg version>/<date>/ (the UTC date of the pull); --out
writes somewhere else:

    experiment.json  the figures the page draws, loaded when it is opened
    summary.json     the few figures the experiments index and the verdict
                     quote, small enough to ship with every page

ttc.py describes how the figures are defined and what experiment.json holds.
"""

import argparse
import os

import ttc


def parse_args():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ttc.add_source_args(ap)
    ap.add_argument(
        "--baseline",
        help="the gg version to measure against: the last build that shipped (required)",
    )
    return ap.parse_args()


def main():
    args = parse_args()
    runs = ttc.Runs(ttc.read(args), args)

    found = ", ".join(runs.versions) or "none"
    if not args.baseline:
        ttc.die(f"name the build to measure against: --baseline <gg version> (versions with runs: {found})", 2)
    if args.baseline == runs.current:
        ttc.die(f"gg {runs.current} is the build under test and cannot be its own baseline", 2)
    if args.baseline not in runs.versions:
        ttc.die(f"no gg {args.baseline} runs to measure against (versions with runs: {found})")

    series = [
        runs.subject(),
        {
            "id": "gg-baseline",
            "label": "gg",
            "role": "baseline",
            "version": args.baseline,
            "rows": runs.of_version(args.baseline),
        },
    ]
    parts, a, comparisons = ttc.compare(runs, series)

    out = args.out or ttc.run_dir("experiments", runs.current, runs.data.get("pulledAt"))
    os.makedirs(out, exist_ok=True)
    if args.save_runs:
        ttc.write(out, "runs.json", runs.data)
    ttc.write(
        out,
        "experiment.json",
        {"meta": runs.meta(baselineVersion=args.baseline), **parts},
        compact=True,
    )

    # Both builds on the pairs both ran, so that the change the index quotes
    # is like for like; the build under test alone when they share none.
    own = ttc.figure(list(a.values()))
    against = comparisons[0]["scopes"]["all"]
    like_for_like = against["pairs"] > 0
    ttc.write(
        out,
        "summary.json",
        ttc.rounded(
            {
                "pulledAt": runs.data.get("pulledAt"),
                "synthetic": bool(runs.data.get("synthetic")),
                **ttc.counts(parts, own),
                "sharedPairs": against["pairs"],
                "experiment": {
                    "version": runs.current,
                    **{
                        m: against["metrics"][m]["subject"] if like_for_like else own["metrics"][m]
                        for m in ttc.SUMMARY_METRICS
                    },
                },
                "baseline": {
                    "version": args.baseline,
                    **{m: against["metrics"][m]["other"] for m in ttc.SUMMARY_METRICS},
                }
                if like_for_like
                else None,
            }
        ),
    )
    ttc.report(series, comparisons, out)


if __name__ == "__main__":
    main()
