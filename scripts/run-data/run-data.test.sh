#!/usr/bin/env bash
# Table test for gg-benchmark-data.py and gg-experiment-data.py. Run it
# directly: ./run-data.test.sh
#
# The scripts are handed a saved runs.json through --from-runs, so nothing here
# reaches a backend. The runs are few enough for every expected figure to be
# worked out by hand: the subject is the pairing (a series is compared with gg
# only on the model and case pairs both ran), the averaging per pair and then
# across pairs, the rule that a gg run with no version is not dropped, and what
# each script leaves to the other.
set -uo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
pass=0
fail=0

check() { # file label expression expected
	local got
	got="$(python3 -c 'import json,sys
d = json.load(open(sys.argv[1]))
vs = {c["against"]: c for c in d.get("comparisons", [])}
print(eval(sys.argv[2]))' "$WORK/$1" "$3" 2>&1)"
	if [ "$got" = "$4" ]; then
		pass=$((pass + 1)); printf '  ok   %s\n' "$2"
	else
		fail=$((fail + 1)); printf 'FAIL  %s\n        expected %s\n        got %s\n' "$2" "$4" "$got"
	fi
}

refuses() { # label expected-in-stderr args...
	local label="$1" expected="$2" got
	shift 2
	if got="$("$SCRIPTS_DIR/gg-experiment-data.py" --from-runs "$WORK/runs.json" --out "$WORK/refused" "$@" 2>&1 >/dev/null)"; then
		fail=$((fail + 1)); printf 'FAIL  %s\n        the script exited zero\n' "$label"
	elif [[ "$got" == *"$expected"* ]]; then
		pass=$((pass + 1)); printf '  ok   %s\n' "$label"
	else
		fail=$((fail + 1)); printf 'FAIL  %s\n        expected an error naming %s\n        got %s\n' "$label" "$expected" "$got"
	fi
}

python3 - "$WORK/runs.json" <<'PY'
import json, sys


def run(harness, model, case, earned=8, state="completed", version="1.0.0", cost=1.0, day=1):
    done = state == "completed"
    return {
        "id": None, "listing": "published", "startedAt": f"2026-01-{day:02d}T00:00:00Z",
        "state": state, "rating": "great" if done and earned >= 9 else "broken" if done else None,
        "score": {"earned": earned, "total": 10} if done else None, "caseName": case,
        "subject": {
            "testCaseSlug": case, "testCaseVersion": "v1.0.0", "testType": "end-to-end",
            "variant": "base", "harnessSlug": harness, "harnessVersion": version,
            "engineSlug": "none", "modelId": model,
        },
        "metrics": {
            "tokens": {"uncachedInput": 100, "cachedInput": 900, "output": 50, "reasoning": 10},
            "cost": {"comparable": cost}, "sessionSeconds": 60,
        },
    }


runs = [
    # gg 2.0.0: two repeats of gpt/a (pair mean 0.9), one of gpt/b, one of
    # opus/a, and a run of gpt/b that failed before reporting its version.
    run("gg", "gpt-5.5", "a", 10, version="2.0.0", day=10, cost=2.0),
    run("gg", "gpt-5.5", "a", 8, version="2.0.0", day=10, cost=4.0),
    run("gg", "gpt-5.5", "b", 6, version="2.0.0", day=10),
    run("gg", "opus", "a", 10, version="2.0.0", day=10),
    run("gg", "gpt-5.5", "b", state="timed_out", version=None, day=11),
    # gg 1.0.0, earlier: only gpt/a.
    run("gg", "gpt-5.5", "a", 5, version="1.0.0", day=1),
    # codex shares gpt/a and gpt/b with gg; its gpt/c run is gg's to ignore.
    run("codex", "openai/gpt-5.5", "a", 7, cost=1.0),
    run("codex", "openai/gpt-5.5", "b", 5),
    run("codex", "openai/gpt-5.5", "c", 10),
    # claude shares the model opus with nobody's cases but gg's opus/a.
    run("claude", "opus", "z", 10),
]
json.dump(
    {
        "backend": "test", "runStates": ["published"], "pulledAt": "2026-01-12T00:00:00+00:00",
        "runs": runs,
        "models": [
            {"slug": "gpt", "name": "GPT", "aliases": ["gpt-5.5", "openai/gpt-5.5"], "coveredModelIds": []},
            {"slug": "opus", "name": "Opus", "aliases": [], "coveredModelIds": []},
        ],
    },
    open(sys.argv[1], "w"),
)
PY

"$SCRIPTS_DIR/gg-benchmark-data.py" --from-runs "$WORK/runs.json" --out "$WORK/benchmark" >/dev/null 2>&1 \
	|| { echo "FAIL  gg-benchmark-data.py exited non-zero"; exit 1; }
"$SCRIPTS_DIR/gg-experiment-data.py" --from-runs "$WORK/runs.json" --baseline 1.0.0 --out "$WORK/experiment" >/dev/null 2>&1 \
	|| { echo "FAIL  gg-experiment-data.py exited non-zero"; exit 1; }

echo "gg-benchmark-data.py"
B=benchmark/benchmark.json
check $B "the newest gg version is current" 'd["meta"]["currentVersion"]' "2.0.0"
check $B "the time of the pull is kept" 'd["meta"]["pulledAt"]' "2026-01-12T00:00:00+00:00"
check $B "a gg run with no version joins the nearest version" 'd["series"][0]["runs"]' "5"
check $B "other harnesses are found without being named" '[s["id"] for s in d["series"][1:]]' "['codex', 'claude']"
check $B "gg's earlier builds are left to the experiments" '[s["role"] for s in d["series"]]' "['subject', 'other', 'other']"
check $B "models are matched across spellings" 'vs["codex"]["scopes"]["all"]["pairs"]' "2"
# gg: gpt/a = 0.9, gpt/b = (0.6 + 0) / 2 = 0.3. codex: 0.7 and 0.5.
check $B "pass rate is averaged per pair, then across pairs" 'round(vs["codex"]["scopes"]["all"]["metrics"]["passRate"]["subject"], 6)' "0.6"
check $B "the difference is gg minus the other side" 'round(vs["codex"]["scopes"]["all"]["metrics"]["passRate"]["delta"], 6)' "0.0"
check $B "no interval below three pairs" 'vs["codex"]["scopes"]["all"]["metrics"]["passRate"]["low"]' "None"
check $B "a failed run has no cost to average" 'vs["codex"]["scopes"]["all"]["metrics"]["costUsd"]["subject"]' "2.0"
check $B "a failed run counts against the good share" 'vs["codex"]["scopes"]["all"]["metrics"]["goodShare"]["subject"]' "0.25"
check $B "a model scope holds only that model" 'vs["codex"]["scopes"]["opus"]["pairs"], d["subject"]["scopes"]["opus"]["pairs"]' "(0, 1)"
check $B "no shared case is a reason, not a failure" 'vs["claude"]["reason"]' "no shared test cases on the shared models"
check $B "a case carries only the metrics the grid shows" 'sorted(vs["codex"]["scopes"]["all"]["cases"][0]["metrics"])' "['completionRate', 'costUsd', 'durationSeconds', 'goodShare', 'passRate', 'totalTokens']"
check $B "only runs on gg's pairs are kept for the spread" 'sorted({r["series"] for r in d["runs"]})' "['codex', 'gg']"
check benchmark/summary.json "the summary says which build, when and what it ran" 'd["version"], d["pulledAt"], d["models"], d["cases"], d["pairs"], d["runs"]' "('2.0.0', '2026-01-12T00:00:00+00:00', 2, 2, 3, 5)"
check benchmark/summary.json "the summary counts the harnesses that share a pair" 'd["harnesses"]' "1"

echo "gg-experiment-data.py"
E=experiment/experiment.json
check $E "the named build is the baseline" 'd["meta"]["currentVersion"], d["meta"]["baselineVersion"]' "('2.0.0', '1.0.0')"
check $E "the time of the pull is kept" 'd["meta"]["pulledAt"]' "2026-01-12T00:00:00+00:00"
check $E "no other harness or gg version is read" '[(s["id"], s["role"]) for s in d["series"]]' "[('gg', 'subject'), ('gg-baseline', 'baseline')]"
# gg 2.0.0 and 1.0.0 share only gpt/a: 0.9 against 0.5.
check $E "the baseline is compared on shared pairs" 'vs["gg-baseline"]["scopes"]["all"]["pairs"], vs["gg-baseline"]["scopes"]["all"]["metrics"]["passRate"]["delta"]' "(1, 0.4)"
check $E "only gg's runs are kept for the spread" 'sorted({r["series"] for r in d["runs"]})' "['gg', 'gg-baseline']"
check experiment/summary.json "the summary compares gg's builds like for like" 'd["experiment"]["passRate"], d["baseline"]["passRate"], d["sharedPairs"]' "(0.9, 0.5, 1)"
check experiment/summary.json "the summary counts what gg ran" 'd["models"], d["cases"], d["pairs"], d["runs"]' "(2, 2, 3, 5)"
refuses "a baseline has to be named" "--baseline <gg version> (versions with runs: 1.0.0, 2.0.0)"
refuses "a baseline with no runs is refused" "no gg 0.9.0 runs" --baseline 0.9.0
refuses "a build is not its own baseline" "cannot be its own baseline" --baseline 2.0.0

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
