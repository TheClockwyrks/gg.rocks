#!/usr/bin/env bash
# Table test for gg-docs.sh. Run it directly: scripts/gg-docs.test.sh
#
# A copy of the script runs in a throwaway site repository whose pin names a
# throwaway gg repository on disk, reached over file:// so the clone is the
# same shallow, sparse one the real fetch makes. Nothing reaches the network.
# The subject is which pages land where, what is fetched again, and what is
# refused.
set -uo pipefail

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPTS_DIR
pass=0
fail=0

ok() { pass=$((pass + 1)); printf '  ok   %s\n' "$1"; }
bad() {
	fail=$((fail + 1))
	printf 'FAIL  %s\n' "$1"
	shift
	printf '        %s\n' "$@"
}

check_equal() { # label expected actual
	if [ "$2" = "$3" ]; then
		ok "$1"
	else
		bad "$1" "expected: $2" "got:      ${3:-<empty>}"
	fi
}

check_contains() { # label needle haystack
	if grep -qF -- "$2" <<<"$3"; then
		ok "$1"
	else
		bad "$1" "expected output containing: $2" "got: ${3:-<empty>}"
	fi
}

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.invalid
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.invalid

# The gg repository: v0.7.1 holds docs/ and code beside it, v0.7.2 changes a
# page, and v0.0.9 has no docs/ at all.
gg="$tmp/gg"
git init --quiet -b master "$gg"
mkdir -p "$gg/src"
echo "fn main() {}" >"$gg/src/main.rs"
git -C "$gg" add . && git -C "$gg" commit --quiet -m code
git -C "$gg" tag v0.0.9
mkdir -p "$gg/docs/languages"
printf -- '---\ntitle: "Overview"\n---\n\nFirst.\n' >"$gg/docs/overview.md"
printf -- '---\ntitle: "Rust"\n---\n\nRust.\n' >"$gg/docs/languages/rust.md"
git -C "$gg" add . && git -C "$gg" commit --quiet -m docs
git -C "$gg" tag v0.7.1
printf -- '---\ntitle: "Overview"\n---\n\nSecond.\n' >"$gg/docs/overview.md"
git -C "$gg" commit --quiet -am "docs: revise"
git -C "$gg" tag v0.7.2
git clone --quiet --bare "$gg" "$tmp/gg.git"
git -C "$tmp/gg.git" config uploadpack.allowFilter true
readonly REMOTE="file://$tmp/gg.git"

site="$tmp/site"
mkdir -p "$site/scripts" "$site/apps/web" "$tmp/elsewhere"
site="$(cd "$site" && pwd -P)"
cp "$SCRIPTS_DIR/gg-docs.sh" "$site/scripts/"
cache="$site/apps/web/.gg-docs"

pin() { # version [repository]
	printf '{\n  "version": "%s",\n  "repository": "%s"\n}\n' "$1" "${2-$REMOTE}" \
		>"$site/apps/web/gg-docs.json"
}

run() { # [VAR=value...]: runs the script from another folder, with env
	(cd "$tmp/elsewhere" && env "$@" "$site/scripts/gg-docs.sh" 2>&1)
}

echo "== a fresh fetch"
pin 0.7.1
out="$(run)"
code=$?
check_equal "exits 0" 0 "$code"
check_contains "names the version" "v0.7.1" "$out"
check_equal "the overview lands" "First." \
	"$(tail -n1 "$cache/v0.7.1/docs/overview.md" 2>/dev/null)"
check_equal "nested pages land" "Rust." \
	"$(tail -n1 "$cache/v0.7.1/docs/languages/rust.md" 2>/dev/null)"
check_equal "only docs/ is kept" "docs" "$(ls "$cache/v0.7.1" 2>/dev/null)"
check_equal "no work folder is left" "" \
	"$(find "$cache" -maxdepth 1 -name '.fetch.*' 2>/dev/null)"

echo "== a version already there"
mv "$tmp/gg.git" "$tmp/gone.git"
out="$(run)"
code=$?
check_equal "exits 0 without the repository" 0 "$code"
check_contains "says it is already there" "already" "$out"
mv "$tmp/gone.git" "$tmp/gg.git"

echo "== a new pin"
pin 0.7.2
out="$(run)"
code=$?
check_equal "exits 0" 0 "$code"
check_equal "the new version's page lands" "Second." \
	"$(tail -n1 "$cache/v0.7.2/docs/overview.md" 2>/dev/null)"
check_equal "the old version is removed" "v0.7.2" "$(ls "$cache")"

echo "== GG_DOCS_REPOSITORY"
rm -rf "$cache"
pin 0.7.1 "file://$tmp/nowhere.git"
out="$(run GG_DOCS_REPOSITORY="$REMOTE")"
code=$?
check_equal "exits 0" 0 "$code"
check_equal "fetches from the override" "First." \
	"$(tail -n1 "$cache/v0.7.1/docs/overview.md" 2>/dev/null)"

echo "== refusals"
rm -rf "$cache"
pin 0.7.9
out="$(run)"
code=$?
check_equal "a missing tag exits 1" 1 "$code"
check_contains "says what it could not clone" "could not clone" "$out"
check_equal "a missing tag leaves no pages" "" \
	"$(find "$cache" -mindepth 1 -maxdepth 1 2>/dev/null)"

pin 0.0.9
out="$(run)"
code=$?
check_equal "a tag without docs/ exits 1" 1 "$code"
check_contains "says it has no docs/" "has no docs/" "$out"
check_equal "a tag without docs/ leaves no pages" "" \
	"$(find "$cache" -mindepth 1 -maxdepth 1 2>/dev/null)"

pin "latest"
out="$(run)"
code=$?
check_equal "a pin without a version exits 1" 1 "$code"
check_contains "says the pin has no version" "pins no version" "$out"

rm -f "$site/apps/web/gg-docs.json"
out="$(run)"
code=$?
check_equal "no pin exits 1" 1 "$code"
check_contains "says there is no pin" "no pin" "$out"

echo "== GG_DOCS_DIR"
pin 0.7.1 "file://$tmp/nowhere.git"
mkdir -p "$tmp/gg-checkout/docs"
out="$(run GG_DOCS_DIR=../gg-checkout/docs)"
code=$?
check_equal "a folder relative to the root exits 0" 0 "$code"
check_contains "names the folder" "$tmp/site/../gg-checkout/docs" "$out"
check_equal "nothing is fetched" "" \
	"$(find "$cache" -mindepth 1 -maxdepth 1 2>/dev/null)"
out="$(run GG_DOCS_DIR="$tmp/gg-checkout/docs")"
code=$?
check_equal "an absolute folder exits 0" 0 "$code"
out="$(run GG_DOCS_DIR=missing)"
code=$?
check_equal "a missing folder exits 1" 1 "$code"
check_contains "says it is not a folder" "is not a folder" "$out"

echo
echo "gg-docs.sh: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
