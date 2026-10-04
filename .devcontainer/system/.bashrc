#!/usr/bin/env bash
alias gg=lazygit
alias dd='sudo $HOME/.local/bin/lazydocker'

# `uv` prefers to hardlink files from whatever folder it uses as its cache,
# but this won't work in a container since the repository folder is mounted
# from the host file system.
export UV_LINK_MODE=copy
