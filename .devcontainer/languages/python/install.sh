#!/usr/bin/env bash
# Installs Python-side WebAssembly component tooling used by the Gaia examples.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

bash "$SCRIPT_DIR/wasm.sh"
