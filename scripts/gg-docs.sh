#!/usr/bin/env bash
# Puts gg's documentation pages where the site's build reads them.
#
# The docs section presents the `docs/` folder of the `gg` repository at the
# version apps/web/gg-docs.json pins, taken from its tag `v<version>` on the
# repository the pin names (the public GitHub mirror). The pages land in
# apps/web/.gg-docs/v<version>/docs, which git ignores; a version already
# there is not fetched again, and any other version there is removed.
#
# GG_DOCS_DIR names a folder of pages to build from instead, relative to this
# repository's root (`../gg/docs` inside the superrepo, to preview pages not
# yet released); nothing is fetched then. GG_DOCS_REPOSITORY overrides the
# repository the pin names.
#
# Run by `npm run build` and `npm run dev` in apps/web, before Vite starts.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly ROOT
readonly PIN="$ROOT/apps/web/gg-docs.json"
readonly CACHE="$ROOT/apps/web/.gg-docs"

die() {
	echo "gg-docs: $*" >&2
	exit 1
}

# A string field of the pin, which is flat JSON with one field to a line.
field() {
	sed -nE "s/^[[:space:]]*\"$1\"[[:space:]]*:[[:space:]]*\"([^\"]*)\".*/\1/p" "$PIN"
}

[ -f "$PIN" ] || die "no pin at $PIN"
version="$(field version)"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "$PIN pins no version"
repository="${GG_DOCS_REPOSITORY:-$(field repository)}"
[ -n "$repository" ] || die "$PIN names no repository"

if [ -n "${GG_DOCS_DIR:-}" ]; then
	case "$GG_DOCS_DIR" in
	/*) dir="$GG_DOCS_DIR" ;;
	*) dir="$ROOT/$GG_DOCS_DIR" ;;
	esac
	[ -d "$dir" ] || die "GG_DOCS_DIR=$GG_DOCS_DIR is not a folder"
	echo "gg-docs: building from $dir (GG_DOCS_DIR) in place of v$version"
	exit 0
fi

target="$CACHE/v$version"
if [ -d "$target/docs" ]; then
	echo "gg-docs: v$version is already in $target/docs"
	exit 0
fi

mkdir -p "$CACHE"
work="$(mktemp -d "$CACHE/.fetch.XXXXXX")"
trap 'rm -rf "$work"' EXIT

echo "gg-docs: fetching docs/ of $repository at v$version"
# A shallow, sparse clone of the tag: the commit's tree, and the blobs of
# docs/ and the root's files alone.
git -c advice.detachedHead=false clone --quiet --depth 1 --branch "v$version" \
	--filter=blob:none --sparse "$repository" "$work/gg" ||
	die "could not clone $repository at v$version"
git -C "$work/gg" sparse-checkout set docs ||
	die "could not check out docs/ of v$version"
[ -d "$work/gg/docs" ] || die "v$version of $repository has no docs/"

# Every other version is a leftover of an earlier pin.
find "$CACHE" -mindepth 1 -maxdepth 1 -name 'v*' -exec rm -rf {} +
mkdir -p "$target"
mv "$work/gg/docs" "$target/docs"
echo "gg-docs: v$version is in $target/docs"
