#!/usr/bin/env bash
# Installs lazygit
set -euo pipefail

# Determine the architecture name that lazygit uses for the current platform
if [ "$BUILDARCH" = "amd64" ]; then
	readonly LAZYGIT_ARCH="x86_64"
else
	readonly LAZYGIT_ARCH="arm64"
fi

# See https://github.com/jesseduffield/lazygit/releases for the URLs that are
# needed to download the correct version of lazygit
readonly ARCHIVE_NAME="lazygit_${LAZYGIT_VERSION}_Linux_${LAZYGIT_ARCH}.tar.gz"
readonly DOWNLOAD_BASE_URL="https://github.com/jesseduffield/lazygit/releases/download/"
readonly TAR_PATH="/tmp/$USERNAME/lazygit.tar.gz"
readonly INSTALL_PATH="/home/$USERNAME/lazygit/$LAZYGIT_VERSION"
readonly BIN_PATH="$HOME/.local/bin/lazygit"

wget -O "$TAR_PATH" "$DOWNLOAD_BASE_URL/v$LAZYGIT_VERSION/$ARCHIVE_NAME"
mkdir -p "$INSTALL_PATH"
tar -xzf "$TAR_PATH" -C "$INSTALL_PATH"
ln -s "$INSTALL_PATH/lazygit" "$BIN_PATH"
