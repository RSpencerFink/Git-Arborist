#!/usr/bin/env bun
/**
 * Generates a Homebrew formula for gw given a version and SHA256 checksums.
 * Usage: bun scripts/update-formula.ts <version> <darwin-arm64-sha> <darwin-x64-sha> <linux-arm64-sha> <linux-x64-sha>
 */

const [version, darwinArm64Sha, darwinX64Sha, linuxArm64Sha, linuxX64Sha] =
  process.argv.slice(2);

if (
  !version ||
  !darwinArm64Sha ||
  !darwinX64Sha ||
  !linuxArm64Sha ||
  !linuxX64Sha
) {
  console.error(
    "Usage: bun scripts/update-formula.ts <version> <darwin-arm64-sha> <darwin-x64-sha> <linux-arm64-sha> <linux-x64-sha>",
  );
  process.exit(1);
}

const baseUrl = `https://github.com/gw-cli/gw/releases/download/v${version}`;

const formula = `# typed: false
# frozen_string_literal: true

class Gw < Formula
  desc "Git Worktrees, Finally Simple"
  homepage "https://github.com/gw-cli/gw"
  version "${version}"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "${baseUrl}/gw-darwin-arm64"
      sha256 "${darwinArm64Sha}"
    else
      url "${baseUrl}/gw-darwin-x64"
      sha256 "${darwinX64Sha}"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "${baseUrl}/gw-linux-arm64"
      sha256 "${linuxArm64Sha}"
    else
      url "${baseUrl}/gw-linux-x64"
      sha256 "${linuxX64Sha}"
    end
  end

  def install
    binary = Dir.glob("gw-*").first || "gw"
    bin.install binary => "gw"
  end

  test do
    assert_match "gw #{version}", shell_output("#{bin}/gw --version")
  end
end
`;

console.log(formula);
