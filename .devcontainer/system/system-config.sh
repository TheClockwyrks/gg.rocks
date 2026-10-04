#!/usr/bin/env bash
# Applies base OS configuration after apt packages are installed.
set -euo pipefail

# By default, `/usr/bin/python3` points to the distro Python. Repoint it to
# the requested version for consistency inside the container.
rm -f /usr/bin/python3
update-alternatives --install \
	/usr/bin/python3 python3 "/usr/bin/python${PYTHON_VERSION}" 100

# This is used to avoid git warnings when using hooks.
locale-gen en_US.UTF-8
update-locale LANG=en_US.UTF-8
