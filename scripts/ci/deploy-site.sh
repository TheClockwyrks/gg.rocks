#!/usr/bin/env bash
# Builds the site and deploys it to Cloudflare Pages.
#
#   scripts/ci/deploy-site.sh <branch>
#
# `master` deploys to the `gg-rocks` project (gg.rocks) and `staging` to
# `gg-rocks-staging` (staging.gg.rocks). The branch is passed to wrangler as
# `--branch`, which makes the upload that project's production deployment,
# because each project's production branch is the branch it deploys from. The
# superrepo's Releasing page (apps/docs/src/content/docs/development/
# releasing.md), section "gg.rocks (Cloudflare Pages, one-time)", says how the
# two projects are set up.
#
# CLOUDFLARE_API_TOKEN (Cloudflare Pages: Edit) and CLOUDFLARE_ACCOUNT_ID must
# be in the environment. The pipeline's deploy stage maps them from its secret
# variables of the same names.
set -euo pipefail

# The wrangler release the superrepo's sites deploy with (WRANGLER_VERSION in
# its scripts/ci/deploy-docs.sh and the publisher image).
readonly WRANGLER_VERSION="4.40.3"
# The site's npm workspace member and what its build writes.
readonly SITE="apps/web"

if [[ $# -ne 1 ]]; then
	echo "usage: scripts/ci/deploy-site.sh <branch>" >&2
	exit 1
fi
readonly BRANCH="$1"

case "$BRANCH" in
	master) project=gg-rocks ;;
	staging) project=gg-rocks-staging ;;
	*)
		echo "deploy-site.sh: '${BRANCH}' deploys no site (expected master or staging)" >&2
		exit 1
		;;
esac

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN must be set}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID must be set}"

# From the repository root, whatever directory the caller ran it from.
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

echo "=== npm ci ==="
npm ci --no-audit --no-fund

# By its directory rather than its package name, which the site decides.
echo "=== build ${SITE} ==="
npm run build -w "$SITE"

echo "=== deploy to ${project} ==="
npx --yes "wrangler@${WRANGLER_VERSION}" pages deploy "${SITE}/dist" \
	--project-name="$project" --branch="$BRANCH"
