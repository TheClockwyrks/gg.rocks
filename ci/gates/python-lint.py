"""Lint and check the formatting of the Python the gates and the run-data scripts are written in.

ruff is one tool doing the two jobs the Rust and the web trees split over
several: the lint (`ruff check`) and the format (`ruff format --check`). It is
a dev dependency of the `ci` project, so the interpreter running this gate has
it, and the settings it reads are in ci/pyproject.toml.

The paths are named here rather than left to ruff's own discovery: `ci/` and
`scripts/run-data/` are this workspace's Python, and a scratch checkout under
`tmp/` is not.
"""

import sys

from the_test_cabinet_ci import enter_repo_root, fail, succeeded

# From the workspace root, so ruff finds the project's pyproject.toml
# regardless of the caller's working directory.
enter_repo_root()

# `ci/` as the kit renders it, then this site's own: the scripts that turn runs
# on The Test Cabinet into the data its pages chart, which
# `scripts/run-data/ruff.toml` holds to `ci/pyproject.toml`'s rules. A path
# added here is added to the hook's `files` in .pre-commit-config.yaml too.
PROJECTS = ["ci", "scripts/run-data"]

# The gate runs in the `ci` project's environment, which carries ruff, so the
# interpreter running this script runs it.
ruff = [sys.executable, "-m", "ruff"]

lint = succeeded([*ruff, "check", *PROJECTS])
# Both run before the verdict: a formatting complaint and a lint complaint are
# reported together rather than one commit at a time.
formatted = succeeded([*ruff, "format", "--check", *PROJECTS])

if not lint or not formatted:
    fail(
        "",
        "ruff is not satisfied with the Python. Fix it with:",
        "    uv run --project ci ruff check --fix " + " ".join(PROJECTS),
        "    uv run --project ci ruff format " + " ".join(PROJECTS),
    )
