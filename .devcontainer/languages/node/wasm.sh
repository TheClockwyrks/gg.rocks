#!/usr/bin/env bash
# Installs the JS-family component tooling used by the Gaia examples.
set -euo pipefail

readonly COMPONENTIZE_JS_VERSION="0.19.3"
readonly ESBUILD_VERSION="0.28.0"
readonly TYPESCRIPT_VERSION="6.0.2"

npm install -g \
	"@bytecodealliance/componentize-js@${COMPONENTIZE_JS_VERSION}" \
	"esbuild@${ESBUILD_VERSION}" \
	"typescript@${TYPESCRIPT_VERSION}"
