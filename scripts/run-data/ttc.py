"""What the run data scripts share: reading The Test Cabinet's runs and working
out the figures the site charts.

gg-benchmark-data.py and gg-experiment-data.py differ only in what gg is set
against, the other harnesses or an earlier build of its own; everything else
is here.

Only GET requests are issued, and only two reads: the summary projection of the
run listing, and the model catalog, which names the same model across harnesses
that spell its id differently. The backend is REQUIRED and has no default, so a
read can never silently reach prod.

The one rule behind every comparison: another series is only compared with gg
on the PAIRS both ran, a pair being one model on one test case. A series that
ran a stronger model, or easier cases, gets no credit for it.

How the figures are defined:

- A "case" is a test case at one major.minor version, variant and engine.
- Pass rate is a run's checklist score, earned weight over total weight. A run
  that did not complete scores zero. A completed run with no score is left out.
- Good share is the share of runs rated great or flawless. A run that did not
  complete counts against it; a completed run nobody has rated is left out.
- Cost is the comparable cost, from the model's list price.
- Duration is the harness session, the model's own working time.
- Every average is taken per pair first (over its repeat runs) and then across
  pairs, so each pair counts equally however many runs it has.
- A difference is gg minus the other side, averaged over the shared pairs. Its
  interval is a 95% bootstrap over those pairs, and is null below three pairs.

What both scripts write, beside what is their own:

    meta         where and when the runs were read; `pulledAt` is the moment of
                 the pull, in UTC, which every page built on the file shows
    series       gg's build first, then each series it is set against
    models       the models gg's build ran: the page's model filter
    cases        the test cases gg's build ran
    subject      gg's own figures, per scope
    comparisons  gg against each other series on their shared pairs, per scope
    runs         every run on a pair gg ran, for the run-to-run spread

A scope is "all" (every shared pair) or one model's id (that model's pairs).

A gg run that failed before reporting its version is counted with the gg
version whose runs started nearest in time, so that failures are not dropped.
A null figure means "no data", never zero. The large file is written compact,
with figures rounded to four significant digits, to keep it small.
"""

import argparse
import datetime
import json
import os
import random
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

# The deployed backends, behind the VPN-only internal ingress.
BACKENDS = {
    "prod": "https://api.tcab.testcabinet.ai",
    "staging": "https://api.staging.tcab.testcabinet.ai",
}

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RUN_DATA = os.path.join(ROOT, "run-data")

SUBJECT = "gg"

LABELS = {
    "gg": "gg",
    "codex": "Codex",
    "claude": "Claude Code",
    "opencode": "OpenCode",
    "pi": "Pi",
}

RATINGS = ["flawless", "great", "passable", "scuffed", "broken"]
GOOD = {"flawless", "great"}
CATEGORIES = RATINGS + ["didNotFinish", "unrated"]
# How a run ended, as the outcome chart groups it.
ENDINGS = {
    "completed": "completed",
    "catastrophic": "gaveUp",
    "timed_out": "ranOut",
    "limit_exceeded": "ranOut",
    "hung": "ranOut",
    "harness_error": "harnessError",
}
ENDING_IDS = ["completed", "gaveUp", "ranOut", "harnessError"]

METRICS = [
    "passRate",
    "goodShare",
    "completionRate",
    "costUsd",
    "totalTokens",
    "uncachedInputTokens",
    "cachedInputTokens",
    "outputTokens",
    "durationSeconds",
]

# The metrics the case by case grid can show; the rest are only ever charted
# for a whole scope.
CASE_METRICS = [
    "passRate",
    "goodShare",
    "completionRate",
    "costUsd",
    "totalTokens",
    "durationSeconds",
]
# The few figures a summary.json quotes.
SUMMARY_METRICS = ["passRate", "costUsd", "totalTokens", "cachedInputTokens"]

SUBJECT_FIELDS = [
    "testCaseSlug",
    "testCaseVersion",
    "testType",
    "variant",
    "harnessSlug",
    "harnessVersion",
    "engineSlug",
    "modelId",
    "ggPreset",
    "ggConfigId",
]

PAGE = 200
BOOTSTRAP_DRAWS = 2000
MIN_PAIRS_FOR_INTERVAL = 3

warnings = []


def warn(message):
    warnings.append(message)
    print(f"warning: {message}", file=sys.stderr)


def die(message, code=1):
    print(f"error: {message}", file=sys.stderr)
    sys.exit(code)


# --- reading ---------------------------------------------------------------


def get(backend, path, params=None):
    url = backend.rstrip("/") + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as e:
        return e.code, {"error": {"message": e.read().decode("utf-8", "replace")[:200]}}
    except (urllib.error.URLError, TimeoutError, ValueError) as e:
        die(f"{url}: {e}\n(the deployed backends are reachable over the VPN only)")


def trim(run, listing):
    """Keep only the fields the figures are computed from."""
    subject = run.get("subject")
    if not isinstance(subject, dict) or "state" not in run:
        die(f"a run summary has an unexpected shape: {json.dumps(run)[:200]}")
    metrics = run.get("metrics") or {}
    score = run.get("score")
    return {
        "id": run.get("id"),
        "listing": listing,
        "startedAt": run.get("startedAt"),
        "state": run["state"],
        "rating": run.get("rating"),
        "score": {"earned": score.get("earned"), "total": score.get("total")} if score else None,
        "caseName": run.get("caseName"),
        "subject": {k: subject.get(k) for k in SUBJECT_FIELDS},
        "metrics": {
            "tokens": metrics.get("tokens"),
            "cost": {"comparable": (metrics.get("cost") or {}).get("comparable")},
            "sessionSeconds": metrics.get("sessionSeconds"),
        },
    }


def pull(backend, states):
    status, body = get(backend, "/models")
    if status != 200 or not isinstance(body.get("models"), list):
        die(f"GET /models answered {status}: {json.dumps(body)[:200]}")
    models = [
        {
            "slug": m.get("slug"),
            "name": m.get("name"),
            "aliases": [a.get("slug") for a in m.get("aliases") or []],
            "coveredModelIds": m.get("coveredModelIds") or [],
        }
        for m in body["models"]
    ]
    runs = {}
    for state in states:
        offset = 0
        while True:
            status, body = get(
                backend,
                "/runs",
                {"state": state, "fields": "summary", "offset": offset, "limit": PAGE},
            )
            if status != 200 or not isinstance(body.get("runs"), list):
                die(f"GET /runs ({state}) answered {status}: {json.dumps(body)[:200]}")
            page = body["runs"]
            offset += len(page)
            for run in page:
                runs.setdefault(run.get("id"), trim(run, state))
            if not page or offset >= body.get("total", 0):
                break
        print(f"  {state}: {offset} run(s)", file=sys.stderr)
    return {
        "backend": backend,
        "runStates": states,
        "pulledAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "runs": list(runs.values()),
        "models": models,
    }


# --- rows ------------------------------------------------------------------


def normalize_model_id(model_id):
    """An OpenRouter-routed id without its routing prefix and variant tag."""
    return model_id.removeprefix("openrouter/").split(":", 1)[0]


def model_index(models):
    """Every id a catalog entry answers to, mapped to (catalog slug, name)."""
    index = {}
    for m in models:
        entry = (m["slug"], m.get("name") or m["slug"])
        for key in [m["slug"], *m["aliases"], *m["coveredModelIds"]]:
            if key:
                index.setdefault(key, entry)
                index.setdefault(normalize_model_id(key), entry)
    return index


def total(*values):
    reported = [v for v in values if v is not None]
    return sum(reported) if reported else None


def major_minor(version):
    return ".".join((version or "").split(".")[:2])


def to_row(run, index, unmatched):
    subject, metrics = run["subject"], run["metrics"]
    tokens = metrics.get("tokens") or {}
    completed = run["state"] == "completed"
    score = run.get("score")

    if not completed:
        pass_rate, category, good = 0.0, "didNotFinish", 0.0
    else:
        pass_rate = score["earned"] / score["total"] if score and score.get("total") else None
        category = run.get("rating") if run.get("rating") in RATINGS else "unrated"
        good = None if category == "unrated" else float(category in GOOD)

    model_id = subject.get("modelId") or ""
    found = index.get(model_id) or index.get(normalize_model_id(model_id))
    if not found:
        unmatched.add(model_id)
        found = (normalize_model_id(model_id), normalize_model_id(model_id))

    cached = tokens.get("cachedInput")
    return {
        "id": run.get("id"),
        "startedAt": run.get("startedAt") or "",
        "harness": subject.get("harnessSlug"),
        "version": subject.get("harnessVersion"),
        "testType": subject.get("testType"),
        "model": found[0],
        "modelName": found[1],
        "case": "/".join(
            [
                subject.get("testCaseSlug") or "",
                major_minor(subject.get("testCaseVersion")),
                subject.get("variant") or "",
                subject.get("engineSlug") or "none",
            ]
        ),
        "caseName": run.get("caseName") or subject.get("testCaseSlug") or "",
        "category": category,
        "ending": ENDINGS.get(run["state"], "harnessError"),
        "passRate": pass_rate,
        "goodShare": good,
        "completionRate": 1.0 if completed else 0.0,
        "costUsd": (metrics.get("cost") or {}).get("comparable"),
        "totalTokens": total(
            tokens.get("uncachedInput"), cached, tokens.get("output"), tokens.get("reasoning")
        ),
        # The split is only meaningful on a run that breaks cached reads out.
        "uncachedInputTokens": tokens.get("uncachedInput") if cached is not None else None,
        "cachedInputTokens": cached,
        "outputTokens": total(tokens.get("output"), tokens.get("reasoning")),
        "durationSeconds": metrics.get("sessionSeconds"),
    }


def version_key(version):
    return ([int(n) for n in re.findall(r"\d+", version)], version)


def adopt_versions(rows):
    """Give each subject run that never reported a version the version of the
    subject run that started nearest to it. Returns how many were adopted."""
    known = [r for r in rows if r["version"] and r["startedAt"]]
    adopted = 0
    for r in rows:
        if r["version"] or not known:
            continue
        if r["startedAt"]:
            nearest = min(known, key=lambda k: abs(parse_time(k["startedAt"]) - parse_time(r["startedAt"])))
        else:
            nearest = max(known, key=lambda k: k["startedAt"])
        r["version"] = nearest["version"]
        adopted += 1
    return adopted


def parse_time(stamp):
    # Nanosecond precision is more than fromisoformat takes.
    stamp = re.sub(r"(\.\d{6})\d+", r"\1", stamp).replace("Z", "+00:00")
    return datetime.datetime.fromisoformat(stamp).timestamp()


# --- figures ---------------------------------------------------------------


def mean(values):
    reported = [v for v in values if v is not None]
    return sum(reported) / len(reported) if reported else None


def share(rows, field, ids):
    return {i: sum(r[field] == i for r in rows) / len(rows) for i in ids}


def unit(rows):
    """One series' repeat runs of one pair, averaged."""
    out = {m: mean(r[m] for r in rows) for m in METRICS}
    out["runs"] = len(rows)
    out["ratings"] = share(rows, "category", CATEGORIES)
    out["endings"] = share(rows, "ending", ENDING_IDS)
    return out


def units_of(rows):
    """rows -> {(model, case): unit}"""
    buckets = {}
    for r in rows:
        buckets.setdefault((r["model"], r["case"]), []).append(r)
    return {key: unit(rs) for key, rs in buckets.items()}


def side(units):
    """The parts of a figure that are not a paired metric: how many runs it
    rests on and how they were rated and ended, each pair counting equally."""
    return {
        "runs": sum(u["runs"] for u in units),
        "ratings": {c: mean(u["ratings"][c] for u in units) for c in CATEGORIES},
        "endings": {e: mean(u["endings"][e] for u in units) for e in ENDING_IDS},
    }


def figure(units):
    """One series on its own, over a set of pairs."""
    return {
        "pairs": len(units),
        **side(units),
        "metrics": {m: mean(u[m] for u in units) for m in METRICS},
    }


def interval(diffs):
    """A 95% bootstrap interval for the mean of the per-pair differences."""
    if len(diffs) < MIN_PAIRS_FOR_INTERVAL:
        return None, None
    rng = random.Random(0)
    n = len(diffs)
    means = sorted(sum(rng.choices(diffs, k=n)) / n for _ in range(BOOTSTRAP_DRAWS))
    return means[int(0.025 * BOOTSTRAP_DRAWS)], means[int(0.975 * BOOTSTRAP_DRAWS) - 1]


def paired(a_units, b_units, metrics=METRICS, with_interval=True):
    """Each metric on the pairs where both sides report it."""
    out = {}
    for m in metrics:
        both = [(a[m], b[m]) for a, b in zip(a_units, b_units) if a[m] is not None and b[m] is not None]
        diffs = [a - b for a, b in both]
        entry = {
            "pairs": len(both),
            "subject": mean(a for a, _ in both),
            "other": mean(b for _, b in both),
            "delta": mean(diffs),
        }
        if with_interval:
            entry["low"], entry["high"] = interval(diffs)
        out[m] = entry
    return out


def comparison_scope(a, b, keys):
    """gg against one other series on the given shared pairs."""
    keys = sorted(keys)
    a_units, b_units = [a[k] for k in keys], [b[k] for k in keys]
    by_case = {}
    for model, case in keys:
        by_case.setdefault(case, []).append((model, case))
    return {
        "pairs": len(keys),
        "subject": side(a_units),
        "other": side(b_units),
        "metrics": paired(a_units, b_units),
        "cases": [
            {
                "case": case,
                "pairs": len(ks),
                "metrics": paired(
                    [a[k] for k in ks], [b[k] for k in ks], CASE_METRICS, with_interval=False
                ),
            }
            for case, ks in sorted(by_case.items())
        ],
    }


def subject_scope(a, keys):
    keys = sorted(keys)
    by_case = {}
    for model, case in keys:
        by_case.setdefault(case, []).append((model, case))
    return {
        **figure([a[k] for k in keys]),
        "cases": [
            {
                "case": case,
                "pairs": len(ks),
                "metrics": {m: mean(a[k][m] for k in ks) for m in CASE_METRICS},
            }
            for case, ks in sorted(by_case.items())
        ],
    }


def scopes(keys, models, build):
    """`build` over every pair, and over each model's pairs."""
    out = {"all": build(keys)}
    for model in models:
        out[model] = build([k for k in keys if k[0] == model])
    return out


# --- writing ---------------------------------------------------------------


def split_list(value):
    return [v.strip() for v in (value or "").split(",") if v.strip()]


def rounded(value):
    """Every figure to four significant digits: all a chart can show."""
    if isinstance(value, float):
        return float(f"{value:.4g}")
    if isinstance(value, dict):
        return {k: rounded(v) for k, v in value.items()}
    if isinstance(value, list):
        return [rounded(v) for v in value]
    return value


def write(out, name, data, compact=False):
    with open(os.path.join(out, name), "w") as f:
        if compact:
            json.dump(rounded(data), f, separators=(",", ":"))
        else:
            json.dump(data, f, indent=1)
        f.write("\n")


def case_labels(rows):
    """A display label per case: its name, plus whatever tells it apart from
    the other cases of the same name (variant, engine, version)."""
    parts = {}
    for r in rows:
        slug, version, variant, engine = r["case"].split("/")
        parts[r["case"]] = (r["caseName"], variant, engine, version)
    labels = {}
    for case, (name, variant, engine, version) in parts.items():
        siblings = [p for c, p in parts.items() if c != case and p[0] == name]
        extra = []
        if variant not in ("base", "default", "") or any(s[1] != variant for s in siblings):
            extra.append(variant)
        if engine != "none":
            extra.append(engine)
        if any(s[1] == variant and s[2] == engine for s in siblings):
            extra.append(f"v{version.lstrip('v')}")
        labels[case] = " · ".join([name, *extra])
    return labels


# --- a pull ----------------------------------------------------------------


def add_source_args(ap):
    """The arguments that say where the runs come from and where files go."""
    ap.add_argument("--env", choices=sorted(BACKENDS), help="a deployed backend, over the VPN")
    ap.add_argument("--backend", help="a backend base URL (or set TCAB_BACKEND)")
    ap.add_argument("--from-runs", help="compute from a saved runs.json, reading nothing")
    ap.add_argument("--save-runs", action="store_true", help="also write the runs read, as runs.json")
    ap.add_argument("--out", help="output directory (default under run-data/, by gg version and date)")
    ap.add_argument(
        "--run-state",
        default="published",
        help="the run listings to read, e.g. published,unpublished (default published)",
    )
    ap.add_argument("--test-types", default="end-to-end,full-stack")
    ap.add_argument("--current", help="the gg version the figures are for (default: the newest)")


def read(args):
    """The runs and model catalog, from a saved runs.json or a backend."""
    if args.from_runs:
        with open(args.from_runs) as f:
            return json.load(f)
    backend = args.backend or BACKENDS.get(args.env) or os.environ.get("TCAB_BACKEND")
    if not backend:
        die("name the backend: --env <prod|staging>, --backend <url> or TCAB_BACKEND", 2)
    states = split_list(args.run_state)
    print(f"reading {' and '.join(states)} runs from {backend}", file=sys.stderr)
    return pull(backend, states)


class Runs:
    """The rows of one pull, and gg's among them by version."""

    def __init__(self, data, args):
        self.data = data
        self.types = set(split_list(args.test_types))
        index = model_index(data["models"])
        self.unmatched = set()
        rows = [to_row(run, index, self.unmatched) for run in data["runs"]]
        self.excluded_types = sum(r["testType"] not in self.types for r in rows)
        self.rows = [r for r in rows if r["testType"] in self.types]

        self.gg = [r for r in self.rows if r["harness"] == SUBJECT]
        adopted = adopt_versions(self.gg)
        if adopted:
            warn(f"{adopted} gg run(s) reported no version and were counted with the nearest one in time")
        self.versions = sorted({r["version"] for r in self.gg if r["version"]}, key=version_key)
        self.current = args.current or (self.versions[-1] if self.versions else None)

    def of_version(self, version):
        return [r for r in self.gg if version and r["version"] == version]

    def subject(self):
        """gg's build under measurement, as the first series of a file."""
        return {
            "id": "gg",
            "label": "gg",
            "role": "subject",
            "version": self.current,
            "rows": self.of_version(self.current),
        }

    def meta(self, **extra):
        return {
            "backend": self.data.get("backend"),
            "pulledAt": self.data.get("pulledAt"),
            "runStates": self.data.get("runStates", ["published"]),
            "testTypes": sorted(self.types),
            "currentVersion": self.current,
            **extra,
            "synthetic": bool(self.data.get("synthetic")),
            "excluded": {"otherTestTypes": self.excluded_types},
            "warnings": warnings,
        }


def run_dir(kind, version, pulled_at):
    """run-data/<kind>/<gg version>/<UTC date of the pull>"""
    date = (pulled_at or "")[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        date = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    name = re.sub(r"[^\w.+-]", "_", version or "") or "unknown"
    return os.path.join(RUN_DATA, kind, name, date)


def compare(runs, series):
    """gg, the first series, against each of the others on their shared pairs.

    Returns the parts of a file every page reads, and the units and
    comparisons a summary is drawn from."""
    subject_rows = series[0]["rows"]
    if not subject_rows:
        warn("no gg runs; every figure is null")
    a = units_of(subject_rows)
    models = sorted({k[0] for k in a})
    model_names = {r["model"]: r["modelName"] for r in subject_rows}

    comparisons, shown_runs = [], list(subject_rows)
    for s in series[1:]:
        b = units_of(s["rows"])
        keys = set(a) & set(b)
        if not s["rows"]:
            reason = "no runs"
        elif not {k[0] for k in a} & {k[0] for k in b}:
            reason = "no shared models"
        elif not keys:
            reason = "no shared test cases on the shared models"
        else:
            reason = None
        if reason:
            warn(f"gg vs {s['label']} {s['version'] or ''}".rstrip() + f": {reason}")
        comparisons.append(
            {
                "against": s["id"],
                "reason": reason,
                "scopes": scopes(keys, models, lambda ks, b=b: comparison_scope(a, b, ks)),
            }
        )
        shown_runs += [r for r in s["rows"] if (r["model"], r["case"]) in keys]

    labels = case_labels(subject_rows)
    series_of = {id(r): s["id"] for s in series for r in s["rows"]}
    if runs.unmatched:
        warn(
            f"{len(runs.unmatched)} model id(s) match no catalog entry and are compared by "
            f"their own id: {', '.join(sorted(runs.unmatched))}"
        )

    parts = {
        "series": [
            {
                "id": s["id"],
                "label": s["label"],
                "role": s["role"],
                "version": s["version"],
                "versions": s.get("versions", [s["version"]] if s["version"] else []),
                "runs": len(s["rows"]),
            }
            for s in series
        ],
        "models": [{"id": m, "name": model_names[m]} for m in models],
        "cases": [{"id": c, "label": labels[c]} for c in sorted(labels, key=labels.get)],
        "subject": {"scopes": scopes(set(a), models, lambda ks: subject_scope(a, ks))},
        "comparisons": comparisons,
        "runs": [
            {
                "series": series_of[id(r)],
                "model": r["model"],
                "category": r["category"],
                "passRate": r["passRate"],
            }
            for r in shown_runs
        ],
    }
    return parts, a, comparisons


def counts(parts, own):
    """What gg's build ran, for a summary."""
    return {
        "models": len(parts["models"]),
        "cases": len(parts["cases"]),
        "pairs": own["pairs"],
        "runs": own["runs"],
    }


def report(series, comparisons, out):
    """The pass rate differences, as a table on the terminal."""

    def pct(v):
        return "    -" if v is None else f"{v * 100:+5.1f}"

    print(f"\ngg {series[0]['version']} against, on shared pairs:", file=sys.stderr)
    print(f"{'':<4}{'series':<22}{'pairs':>6}{'pass rate, pts':>16}{'interval':>18}")
    for s, c in zip(series[1:], comparisons):
        m = c["scopes"]["all"]["metrics"]["passRate"]
        label = f"{s['label']} {s['version'] or ''}".strip()
        span = f"[{pct(m['low'])}, {pct(m['high'])}]" if m["low"] is not None else "-"
        print(f"{'':<4}{label:<22}{c['scopes']['all']['pairs']:>6}{pct(m['delta']):>16}{span:>18}")
    print(f"\nwrote {os.path.relpath(out)}/ ({len(warnings)} warning(s); see meta.warnings)")
