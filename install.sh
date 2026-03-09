#!/usr/bin/env bash
set -euo pipefail

# arb installer — downloads a pre-built binary from GitHub Releases
# Usage: curl -fsSL https://raw.githubusercontent.com/git-arborist/git-arborist/main/install.sh | bash

REPO="git-arborist/git-arborist"
INSTALL_DIR="${ARB_INSTALL_DIR:-/usr/local/bin}"
FALLBACK_DIR="$HOME/.local/bin"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
error() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Darwin) os="darwin" ;;
    Linux)  os="linux" ;;
    *)      error "Unsupported OS: $os" ;;
  esac

  case "$arch" in
    arm64|aarch64) arch="arm64" ;;
    x86_64)        arch="x64" ;;
    *)             error "Unsupported architecture: $arch" ;;
  esac

  echo "${os}-${arch}"
}

get_latest_version() {
  local url="https://api.github.com/repos/${REPO}/releases/latest"
  if command -v curl &>/dev/null; then
    curl -fsSL "$url" | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/'
  elif command -v wget &>/dev/null; then
    wget -qO- "$url" | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/'
  else
    error "curl or wget is required"
  fi
}

download() {
  local url="$1" dest="$2"
  if command -v curl &>/dev/null; then
    curl -fsSL -o "$dest" "$url"
  elif command -v wget &>/dev/null; then
    wget -qO "$dest" "$url"
  fi
}

main() {
  local version="${1:-}"
  local platform
  platform="$(detect_platform)"

  if [ -z "$version" ]; then
    info "Fetching latest version..."
    version="$(get_latest_version)"
  fi

  if [ -z "$version" ]; then
    error "Could not determine latest version. Pass a version as argument: bash install.sh 0.1.0"
  fi

  local artifact="arb-${platform}"
  local base_url="https://github.com/${REPO}/releases/download/v${version}"
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT

  info "Downloading arb v${version} for ${platform}..."
  download "${base_url}/${artifact}" "${tmp}/arb"
  download "${base_url}/${artifact}.sha256" "${tmp}/${artifact}.sha256"

  info "Verifying checksum..."
  local expected actual
  expected="$(awk '{print $1}' "${tmp}/${artifact}.sha256")"
  if command -v shasum &>/dev/null; then
    actual="$(shasum -a 256 "${tmp}/arb" | awk '{print $1}')"
  elif command -v sha256sum &>/dev/null; then
    actual="$(sha256sum "${tmp}/arb" | awk '{print $1}')"
  else
    error "shasum or sha256sum is required for checksum verification"
  fi

  if [ "$expected" != "$actual" ]; then
    error "Checksum mismatch! Expected ${expected}, got ${actual}"
  fi

  chmod +x "${tmp}/arb"

  # Install to preferred directory, falling back to ~/.local/bin
  local dest="$INSTALL_DIR"
  if [ ! -w "$dest" ] 2>/dev/null; then
    if [ "$dest" = "/usr/local/bin" ]; then
      info "/usr/local/bin is not writable, trying ${FALLBACK_DIR}..."
      dest="$FALLBACK_DIR"
      mkdir -p "$dest"
    else
      error "Install directory ${dest} is not writable"
    fi
  fi

  mv "${tmp}/arb" "${dest}/arb"

  info "Installed arb v${version} to ${dest}/arb"

  # Check if install dir is on PATH
  case ":${PATH}:" in
    *":${dest}:"*) ;;
    *)
      echo ""
      echo "  Add ${dest} to your PATH:"
      echo "    export PATH=\"${dest}:\$PATH\""
      echo ""
      ;;
  esac

  echo ""
  echo "  Shell integration (required for arb go / arb main):"
  echo "    eval \"\$(arb shell-init zsh)\"   # add to ~/.zshrc"
  echo "    eval \"\$(arb shell-init bash)\"  # add to ~/.bashrc"
  echo ""
}

main "$@"
