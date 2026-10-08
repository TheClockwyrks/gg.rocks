#!/usr/bin/env python3
"""A made-up runs.json, so the experiment page can be looked at before gg has
enough real runs to fill it.

    scripts/experiments/gg-experiment-sample.py /tmp/sample-runs.json
    scripts/experiments/gg-experiment-data.py --from-runs /tmp/sample-runs.json --out run-data/sample

Every run in it is invented: four gg versions and four other harnesses over
three models and twelve test cases, with a few repeats of each. It is marked
`synthetic`, which the page reads to say so. The same seed gives the same file.
"""

import json
import random
import sys

rng = random.Random(7)

MODELS = {
    # id as a harness spells it -> (catalog slug, name, strength, $ per run)
    "opus": ("claude-opus-4-8", "Claude Opus 4.8", 0.10, 5.5),
    "gpt": ("gpt-5-6-sol", "GPT-5.6 Sol", 0.07, 3.2),
    "qwen": ("qwen3-8-max", "Qwen3.8 Max", -0.06, 0.9),
}
SPELLING = {
    "gg": {"opus": "anthropic/claude-opus-4.8", "gpt": "openai/gpt-5.6-sol", "qwen": "qwen/qwen3.8-max"},
    "pi": {"opus": "anthropic/claude-opus-4.8", "gpt": "openai/gpt-5.6-sol", "qwen": "qwen/qwen3.8-max"},
    "claude": {"opus": "claude-opus-4-8"},
    "codex": {"gpt": "gpt-5.6-sol"},
    "opencode": {"gpt": "openrouter/openai/gpt-5.6-sol", "qwen": "openrouter/qwen/qwen3.8-max"},
}

# (slug, name, type, variant, ease)
CASES = [
    ("pong", "Carom", "end-to-end", "base", 0.06),
    ("pong", "Carom", "end-to-end", "gyre", 0.01),
    ("cascade", "Cascade", "end-to-end", "base", 0.03),
    ("fathom", "Fathom", "end-to-end", "base", -0.02),
    ("floe", "Floe", "end-to-end", "base", 0.04),
    ("shatter", "Shatter", "end-to-end", "base", 0.00),
    ("meltdown", "Meltdown", "end-to-end", "base", -0.05),
    ("spectra", "Spectra", "end-to-end", "base", 0.02),
    ("wireworm", "Wireworm", "end-to-end", "base", -0.03),
    ("arc-foundry", "Arc Foundry", "full-stack", "base", -0.09),
    ("deepcore", "Deepcore", "full-stack", "base", -0.07),
    ("gantry", "Gantry", "full-stack", "base", -0.11),
]

# harness -> (version, started, quality, run-to-run sd, failure rate,
#             cost factor, cached share, minutes, repeats, cases it ran)
BUILDS = [
    ("gg", "0.8.0", "2026-10-05", 0.86, 0.035, 0.03, 0.78, 0.93, 15, 4, 12),
    ("gg", "0.7.0", "2026-09-21", 0.83, 0.05, 0.05, 1.00, 0.88, 17, 4, 12),
    ("gg", "0.6.0", "2026-09-07", 0.80, 0.06, 0.08, 1.05, 0.80, 18, 2, 12),
    ("gg", "0.5.0", "2026-08-24", 0.74, 0.07, 0.12, 1.20, 0.62, 21, 2, 12),
    ("claude", "2.1.221", "2026-09-28", 0.84, 0.05, 0.04, 0.95, 0.90, 14, 3, 12),
    ("codex", "0.160.1", "2026-09-30", 0.82, 0.07, 0.05, 0.85, 0.86, 11, 3, 12),
    ("pi", "1.0.4", "2026-09-26", 0.78, 0.13, 0.09, 0.90, 0.91, 16, 3, 12),
    ("opencode", "1.18.18", "2026-09-18", 0.75, 0.09, 0.14, 1.10, 0.70, 19, 3, 8),
]
# What each gg build was better or worse at, beyond its overall level.
QUIRKS = {("gg", "0.8.0", "full-stack"): 0.05, ("claude", "2.1.221", "full-stack"): 0.03,
          ("codex", "0.160.1", "full-stack"): -0.04, ("gg", "0.8.0", "meltdown"): -0.09}  # fmt: skip


def rating(fraction):
    for floor, name in [(1.0, "flawless"), (0.97, "great"), (0.9, "passable"), (0.75, "scuffed")]:
        if fraction >= floor:
            return name
    return "broken"


runs = []
for harness, version, started, quality, sd, fails, cost_factor, cached, minutes, repeats, n_cases in BUILDS:
    for key, model_id in SPELLING[harness].items():
        _, _, strength, price = MODELS[key]
        for slug, name, test_type, variant, ease in CASES[:n_cases]:
            level = quality + strength + ease
            level += QUIRKS.get((harness, version, test_type), 0) + QUIRKS.get((harness, version, slug), 0)
            for _ in range(repeats):
                failed = rng.random() < fails
                state = rng.choice(["catastrophic", "catastrophic", "timed_out", "hung", "harness_error"]) if failed else "completed"
                earned = round(150 * max(0.2, min(1.0, rng.gauss(level, sd))))
                cost = price * cost_factor * rng.lognormvariate(0, 0.25) * (1.6 if test_type == "full-stack" else 1)
                tokens = cost / price * 1_300_000
                early = state == "harness_error"
                runs.append(
                    {
                        "id": f"sample-{len(runs):04d}",
                        "listing": "published",
                        "startedAt": f"{started}T{rng.randrange(24):02d}:{rng.randrange(60):02d}:00Z",
                        "state": state,
                        "rating": None if failed or rng.random() < 0.06 else rating(earned / 150),
                        "score": None if failed else {"earned": earned, "total": 150},
                        "caseName": name,
                        "subject": {
                            "testCaseSlug": slug, "testCaseVersion": "v3.0.0", "testType": test_type,
                            "variant": variant, "harnessSlug": harness,
                            "harnessVersion": None if early else version, "engineSlug": "none",
                            "modelId": model_id, "ggPreset": None, "ggConfigId": None,
                        },  # fmt: skip
                        "metrics": {
                            "tokens": None if early else {
                                "uncachedInput": round(tokens * (1 - cached) * 0.95),
                                "cachedInput": round(tokens * cached),
                                "output": round(tokens * 0.012),
                                "reasoning": round(tokens * 0.003),
                            },  # fmt: skip
                            "cost": {"comparable": None if early else cost},
                            "sessionSeconds": None if early else minutes * 60 * rng.lognormvariate(0, 0.2),
                        },
                    }
                )

with open(sys.argv[1], "w") as f:
    json.dump(
        {
            "backend": "synthetic",
            "synthetic": True,
            "runStates": ["published"],
            "pulledAt": "2026-10-07T00:00:00+00:00",
            "runs": runs,
            "models": [
                {"slug": slug, "name": name, "aliases": sorted({s[k] for s in SPELLING.values() if k in s}), "coveredModelIds": []}
                for k, (slug, name, _, _) in MODELS.items()
            ],
        },
        f,
    )
    f.write("\n")
print(f"wrote {len(runs)} invented runs to {sys.argv[1]}", file=sys.stderr)
