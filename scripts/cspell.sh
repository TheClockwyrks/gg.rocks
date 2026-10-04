#!/usr/bin/env bash
# Runs cspell linting on the repository.
set -euo pipefail

# Switch to the repo root
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir/.."

# Run cspell
cspell-cli lint --no-progress --cache --color .
