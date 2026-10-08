#!/usr/bin/env bash
# Table test for gg-experiment-data.py. Run it directly:
# ./gg-experiment-data.test.sh
#
# The script is handed a saved runs.json through --from-runs, so nothing here
# reaches a backend. The runs are few enough for every expected figure to be
# worked out by hand: the subject is the pairing (a harness is compared with gg
# only on the model and case pairs both ran), the averaging per pair and then
# across pairs, and the rule that a gg run with no version is not dropped.
set -uo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
pass=0
fail=0

check() { # label expression expected
	local got
	got="$(python3 -c 'import json,sys
d = json.load(open(sys.argv[1]))
vs = {c["against"]: c for c in d["comparisons"]}
print(eval(sys.argv[2]))' "$WORK/experiment.json" "$2" 2>&1)"
	if [ "$got" = "$3" ]; then
		pass=$((pass + 1)); printf '  ok   %s\n' "$1"
	else
		fail=$((fail + 1)); printf 'FAIL  %s\n        expected %s\n        got %s\n' "$1" "$3" "$got"
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

"$SCRIPTS_DIR/gg-experiment-data.py" --from-runs "$WORK/runs.json" --out "$WORK" >/dev/null 2>&1 \
	|| { echo "FAIL  the script exited non-zero"; exit 1; }

check "the newest gg version is current" 'd["meta"]["currentVersion"], d["meta"]["previousVersion"]' "('2.0.0', '1.0.0')"
check "a gg run with no version joins the nearest version" 'd["series"][0]["runs"]' "5"
check "other harnesses are found without being named" '[s["id"] for s in d["series"][2:]]' "['codex', 'claude']"
check "models are matched across spellings" 'vs["codex"]["scopes"]["all"]["pairs"]' "2"
# gg: gpt/a = 0.9, gpt/b = (0.6 + 0) / 2 = 0.3. codex: 0.7 and 0.5.
check "pass rate is averaged per pair, then across pairs" 'round(vs["codex"]["scopes"]["all"]["metrics"]["passRate"]["subject"], 6)' "0.6"
check "the difference is gg minus the other side" 'round(vs["codex"]["scopes"]["all"]["metrics"]["passRate"]["delta"], 6)' "0.0"
check "no interval below three pairs" 'vs["codex"]["scopes"]["all"]["metrics"]["passRate"]["low"]' "None"
check "a failed run has no cost to average" 'vs["codex"]["scopes"]["all"]["metrics"]["costUsd"]["subject"]' "2.0"
check "a failed run counts against the good share" 'vs["codex"]["scopes"]["all"]["metrics"]["goodShare"]["subject"]' "0.25"
check "a model scope holds only that model" 'vs["codex"]["scopes"]["opus"]["pairs"], d["subject"]["scopes"]["opus"]["pairs"]' "(0, 1)"
check "no shared case is a reason, not a failure" 'vs["claude"]["reason"]' "no shared test cases on the shared models"
check "the previous build is compared on shared pairs" 'vs["gg-previous"]["scopes"]["all"]["metrics"]["passRate"]["delta"]' "0.4"
check "the trend uses the pairs every version ran" 'd["trend"]["basis"], [v["pairs"] for v in d["trend"]["versions"]]' "('shared', [1, 1])"
check "only runs on gg's pairs are kept for the spread" 'sorted({r["series"] for r in d["runs"]})' "['codex', 'gg', 'gg-previous']"

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
