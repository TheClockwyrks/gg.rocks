#!/usr/bin/env python3
"""The figures the benchmarks page charts: gg's current build against every
other harness, from The Test Cabinet's runs.

Run it by hand when a new build of gg ships, then point the page at the pull.
Only gg's current build is read; its earlier builds belong to the experiments
(see gg-experiment-data.py). Every other harness the backend has runs for is
compared, so a new one shows up without being named here.

Usage:
    scripts/run-data/gg-benchmark-data.py --env prod
    scripts/run-data/gg-benchmark-data.py --env staging --run-state published,unpublished
    scripts/run-data/gg-benchmark-data.py --from-runs /tmp/runs.json --out run-data/sample/benchmark

The newest gg version among the runs is taken as the current build; name
another with --current, as when the newest is an experiment that has not
shipped. Two files land in run-data/benchmarks/<gg version>/<date>/ (the UTC
date of the pull); --out writes somewhere else:

    benchmark.json  the figures the page draws, loaded when it is opened
    summary.json    which build, when it was pulled and what it ran, small
                    enough to ship with every page

ttc.py describes how the figures are defined and what benchmark.json holds.
"""

import argparse
import os

import ttc


def parse_args():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ttc.add_source_args(ap)
    ap.add_argument("--competitors", help="only these harness slugs (default: every other harness)")
    return ap.parse_args()


def main():
    args = parse_args()
    runs = ttc.Runs(ttc.read(args), args)

    # gg's build, then every other harness, busiest first.
    wanted = set(ttc.split_list(args.competitors))
    others = {}
    for r in runs.rows:
        if r["harness"] != ttc.SUBJECT and (not wanted or r["harness"] in wanted):
            others.setdefault(r["harness"], []).append(r)
    series = [runs.subject()]
    for slug, rs in sorted(others.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        seen = sorted({r["version"] for r in rs if r["version"]}, key=ttc.version_key)
        series.append(
            {
                "id": slug,
                "label": ttc.LABELS.get(slug, slug),
                "role": "other",
                # One version when its runs agree on it, else the range they span.
                "version": seen[0] if len(seen) == 1 else None,
                "versions": seen,
                "rows": rs,
            }
        )

    parts, a, comparisons = ttc.compare(runs, series)

    out = args.out or ttc.run_dir("benchmarks", runs.current, runs.data.get("pulledAt"))
    os.makedirs(out, exist_ok=True)
    if args.save_runs:
        ttc.write(out, "runs.json", runs.data)
    ttc.write(out, "benchmark.json", {"meta": runs.meta(), **parts}, compact=True)

    own = ttc.figure(list(a.values()))
    ttc.write(
        out,
        "summary.json",
        ttc.rounded(
            {
                "pulledAt": runs.data.get("pulledAt"),
                "synthetic": bool(runs.data.get("synthetic")),
                "version": runs.current,
                **ttc.counts(parts, own),
                # The harnesses that share at least one pair with gg.
                "harnesses": sum(c["scopes"]["all"]["pairs"] > 0 for c in comparisons),
            }
        ),
    )
    ttc.report(series, comparisons, out)


if __name__ == "__main__":
    main()
