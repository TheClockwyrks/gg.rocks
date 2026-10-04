#!/usr/bin/bash
# Handles final setup for the devcontainer.
set -euo pipefail

append_managed_block() {
	local source_file="$1"
	local target_file="$2"
	local block_name="$3"
	local start_marker="# >>> ${block_name} >>>"
	local end_marker="# <<< ${block_name} <<<"

	touch "$target_file"

	if grep -Fq "$start_marker" "$target_file"; then
		return
	fi

	{
		echo
		echo "$start_marker"
		cat "$source_file"
		echo "$end_marker"
	} >> "$target_file"
}

append_managed_block /tmp/scripts/.bashrc "$HOME/.bashrc" "devcontainer bashrc"
append_managed_block /tmp/scripts/.tmux.conf "$HOME/.tmux.conf" "devcontainer tmux"

# Source the bashrc file via bash_profile so that tmux sessions pick up
# all aliases and configuration from the bashrc file.
if ! grep -Fqx ". ~/.bashrc" "$HOME/.bash_profile" 2>/dev/null; then
	echo ". ~/.bashrc" >> "$HOME/.bash_profile"
fi
