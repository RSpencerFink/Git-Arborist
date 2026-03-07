#!/usr/bin/env bun
/**
 * Reads version from package.json, creates a git tag, and pushes it.
 */
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = await Bun.file(resolve(root, "package.json")).json();
const tag = `v${pkg.version}`;

console.log(`Creating release tag: ${tag}`);

const cmds = [
  ["git", "tag", "-a", tag, "-m", `Release ${tag}`],
  ["git", "push", "origin", tag],
];

for (const cmd of cmds) {
  console.log(`$ ${cmd.join(" ")}`);
  const proc = Bun.spawn(cmd, {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
  if (proc.exitCode !== 0) {
    console.error(`Command failed: ${cmd.join(" ")}`);
    process.exit(1);
  }
}

console.log(`\nTag ${tag} pushed. GitHub Actions will create the release.`);
