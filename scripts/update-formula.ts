#!/usr/bin/env bun
/**
 * Generates a Homebrew formula for arb given a version and SHA256 checksums.
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

const baseUrl = `https://github.com/git-arborist/git-arborist/releases/download/v${version}`;

const formula = `# typed: false
# frozen_string_literal: true

class Arb < Formula
  desc "Git Worktrees, Finally Simple"
  homepage "https://github.com/git-arborist/git-arborist"
  version "${version}"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "${baseUrl}/arb-darwin-arm64"
      sha256 "${darwinArm64Sha}"
    else
      url "${baseUrl}/arb-darwin-x64"
      sha256 "${darwinX64Sha}"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "${baseUrl}/arb-linux-arm64"
      sha256 "${linuxArm64Sha}"
    else
      url "${baseUrl}/arb-linux-x64"
      sha256 "${linuxX64Sha}"
    end
  end

  def install
    binary = Dir.glob("arb-*").first || "arb"
    bin.install binary => "arb"
  end

  test do
    assert_match "arb #{version}", shell_output("#{bin}/arb --version")
  end
end
`;

console.log(formula);
