#!/usr/bin/env bash
# Installs the Python component tooling used by the Gaia examples.
set -euo pipefail

readonly COMPONENTIZE_PY_VERSION="0.22.1"

python3 -m pip install \
	--break-system-packages \
	--no-cache-dir \
	--user \
	"componentize-py==${COMPONENTIZE_PY_VERSION}"
