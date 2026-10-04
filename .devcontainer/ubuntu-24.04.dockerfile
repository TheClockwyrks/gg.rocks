FROM ubuntu:24.04
USER root

# This is an auto-provided variable that is supplied by Docker as long as the
#   Dockerfile declares an argument with this name
# This is set to "amd64" for x64 processors and "arm64" for ARM processors
ARG BUILDARCH

ARG USERNAME
ARG USER_UID
ARG USER_GID
ARG DOCKER_GID

ARG LAZYDOCKER_VERSION
ARG LAZYGIT_VERSION
ARG NODE_VERSION
ARG RUST_VERSION
ARG DOTNET_SDK_VERSION
ARG PYTHON_VERSION
ARG NEXTEST_VERSION
ARG SCCACHE_VERSION
ARG TARPAULIN_VERSION
ARG TZ

# Install apt packages, base OS configuration, and the container user
COPY ./system/apt.sh ./system/system-config.sh ./system/init-user.sh /tmp/scripts/
RUN bash /tmp/scripts/apt.sh && \
	bash /tmp/scripts/system-config.sh && \
	bash /tmp/scripts/init-user.sh && \
	rm -rf /tmp/scripts
USER $USERNAME

# Make binaries installed in the next step available via the PATH
# Note that using `${PATH}` and `$PATH` may have different behavior according
#   to https://github.com/moby/moby/issues/42863. For safety, prefer `$PATH`.
ENV PATH="$PATH:/home/$USERNAME/.local/bin"

# Install non-apt package/binaries
COPY ./requirements.txt /tmp/requirements.txt
COPY --chown=${USERNAME}:${USERNAME} \
	./tools/lazygit.yml \
	/home/${USERNAME}/.config/lazygit/config.yml
COPY --chown=${USERNAME}:${USERNAME} \
	./tools/lazydocker.sh \
	./tools/lazygit.sh \
	./ai/codex.sh \
	./ai/claude.sh \
	./post-install.sh \
	./system/.bashrc \
	./system/.tmux.conf \
	/tmp/scripts/
COPY --chown=${USERNAME}:${USERNAME} \
	./languages/node/install.sh \
	./languages/node/wasm.sh \
	/tmp/scripts/languages/node/
COPY --chown=${USERNAME}:${USERNAME} \
	./languages/python/install.sh \
	./languages/python/wasm.sh \
	/tmp/scripts/languages/python/
RUN mkdir -p "$HOME/.local/bin" && \
	mkdir -p /tmp/$USERNAME && \
	# Run install scripts
	bash /tmp/scripts/lazygit.sh && \
	bash /tmp/scripts/lazydocker.sh && \
	bash /tmp/scripts/languages/node/install.sh && \
	bash /tmp/scripts/languages/python/install.sh && \
	bash /tmp/scripts/codex.sh && \
	bash /tmp/scripts/claude.sh && \
	bash /tmp/scripts/post-install.sh && \
	rm -rf /tmp/scripts && \
	# Install npm packages
	npm install -g \
		git+https://github.com/streetsidesoftware/cspell-cli \
		markdownlint-cli2 && \
	# Install Python packages
	python3 -m pip install \
		--break-system-packages \
		--no-cache-dir \
		-r /tmp/requirements.txt
