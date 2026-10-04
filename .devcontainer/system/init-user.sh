#!/usr/bin/bash
set -euo pipefail

# Starting from Ubuntu 23.04, a default user is added that uses UID 1000.
# This dockerfile is derived from one that was originally written to target
#   Ubuntu 22.04. Rather than rewrite the other steps, simply delete the
#   new user and leave the rest of it the same.
userdel -r ubuntu 2>/dev/null || true
groupadd --gid "$USER_GID" "$USERNAME"
useradd --uid "$USER_UID" --gid "$USER_GID" -m "$USERNAME" -s /bin/bash
echo "$USERNAME" ALL=\(root\) NOPASSWD:ALL > "/etc/sudoers.d/$USERNAME"
chmod 0440 "/etc/sudoers.d/$USERNAME"

# Create or reuse the group with the Docker GID, then add the user to it
if getent group "$DOCKER_GID" >/dev/null 2>&1; then
	DOCKER_GROUP="$(getent group "$DOCKER_GID" | cut -d: -f1)";
else
	DOCKER_GROUP="docker";
	groupadd -g "$DOCKER_GID" "$DOCKER_GROUP";
fi

usermod -aG "$DOCKER_GROUP" "$USERNAME"
cp /etc/skel/.bashrc "/home/$USERNAME/.bashrc"
chown -R "$USER_UID:$USER_GID" "/home/$USERNAME"
