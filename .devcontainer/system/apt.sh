#!/usr/bin/env bash
# Installs apt-managed packages.
set -euo pipefail

apt-get update -y

# General purpose packages
DEBIAN_FRONTEND=noninteractive apt-get install -y \
	ca-certificates \
	locales \
	ncurses-term \
	pkg-config

# Developer tools
DEBIAN_FRONTEND=noninteractive apt-get install -y \
	build-essential \
	cloc \
	cmake \
	curl \
	"dotnet-sdk-${DOTNET_SDK_VERSION}" \
	git \
	g++ \
	gcc \
	graphviz \
	jq \
	parallel \
	ripgrep \
	ssh \
	sudo \
	tar \
	tmux \
	tree \
	tzdata \
	unzip \
	vim \
	wget \
	yq \
	zip \
	"python${PYTHON_VERSION}" \
	python3-pip
