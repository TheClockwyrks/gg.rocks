#!/usr/bin/env bash
# Handles first-time setup of the repository. This script is idempotent.
set -euo pipefail

# Require TZ to be set (non-empty), so users explicitly set a time zone
if [ -z "${TZ:-}" ]; then
	echo "Error: TZ is not set. Please export TZ (e.g., 'America/Chicago') and rebuild the devcontainer." >&2
	exit 1
fi

# Configure container timezone
if [ -n "$TZ" ]; then
	sudo ln -snf "/usr/share/zoneinfo/${TZ}" /etc/localtime
	echo "Setting system timezone to '${TZ}'"
	echo "${TZ}" | sudo tee /etc/timezone >/dev/null
fi

# Helper function used to check if a command exists
command_exists() {
	command -v "$1" >/dev/null 2>&1
}

# Install pre-commit if not already installed
if ! command_exists pre-commit; then
	echo "Installing pre-commit..."
	python3 -m pip install --break-system-packages pre-commit
else
	echo "pre-commit is already installed"
fi

# Install pre-commit hooks
echo "Installing pre-commit hooks..."
pre-commit install

# Update pre-commit hooks to latest versions
echo "Updating pre-commit hooks..."
pre-commit autoupdate

# Ensure the 'fonts' symlink exists for the fang app's public assets
SRC_REL="../../../fonts"
DEST_DIR="apps/fang/public"
DEST_LINK="${DEST_DIR}/fonts"

mkdir -p "${DEST_DIR}"
if [ -L "${DEST_LINK}" ]; then
	CURRENT_TARGET=$(readlink "${DEST_LINK}")
	if [ "${CURRENT_TARGET}" != "${SRC_REL}" ]; then
		echo "Updating fonts symlink: ${DEST_LINK} -> ${SRC_REL}"
		rm "${DEST_LINK}"
		ln -s "${SRC_REL}" "${DEST_LINK}"
	else
		echo "Fonts symlink already up to date: ${DEST_LINK} -> ${SRC_REL}"
	fi
elif [ -e "${DEST_LINK}" ]; then
	echo "${DEST_LINK} exists and is not a symlink; leaving as-is"
else
	echo "Creating fonts symlink: ${DEST_LINK} -> ${SRC_REL}"
	ln -s "${SRC_REL}" "${DEST_LINK}"
fi

echo "Initialization complete!"
