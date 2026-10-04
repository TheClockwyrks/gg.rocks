#!/usr/bin/env bash
# Installs lazydocker
set -euo pipefail

# Determine the architecture name that lazydocker uses for the current platform
if [ "$BUILDARCH" = "amd64" ]; then
	readonly LAZYDOCKER_ARCH="x86_64"
else
	readonly LAZYDOCKER_ARCH="arm64"
fi

# See https://github.com/jesseduffield/lazydocker/releases for the URLs that
# are needed to download the correct version of lazydocker
readonly ARCHIVE_NAME="lazydocker_${LAZYDOCKER_VERSION}_Linux_${LAZYDOCKER_ARCH}.tar.gz"
readonly DOWNLOAD_BASE_URL="https://github.com/jesseduffield/lazydocker/releases/download/"
readonly TAR_PATH="/tmp/$USERNAME/lazydocker.tar.gz"
readonly INSTALL_PATH="/home/$USERNAME/lazydocker/$LAZYDOCKER_VERSION"
readonly BIN_PATH="$HOME/.local/bin/lazydocker"

wget -O "$TAR_PATH" "$DOWNLOAD_BASE_URL/v$LAZYDOCKER_VERSION/$ARCHIVE_NAME"
mkdir -p "$INSTALL_PATH"
tar -xzf "$TAR_PATH" -C "$INSTALL_PATH"
ln -s "$INSTALL_PATH/lazydocker" "$BIN_PATH"
