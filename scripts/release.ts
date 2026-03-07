#!/usr/bin/env bun
/**
 * Bumps the patch version, commits, creates a git tag, and pushes.
 * Usage:
 *   bun scripts/release.ts          # bump patch (0.1.0 -> 0.1.1)
 *   bun scripts/release.ts minor    # bump minor (0.1.1 -> 0.2.0)
 *   bun scripts/release.ts major    # bump major (0.2.0 -> 1.0.0)
 */
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkgPath = resolve(root, "package.json");
const pkg = await Bun.file(pkgPath).json();

const [major, minor, patch] = pkg.version.split(".").map(Number);
const bump = process.argv[2] || "patch";

let newVersion: string;
switch (bump) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  default:
    console.error(`Unknown bump type: ${bump}. Use major, minor, or patch.`);
    process.exit(1);
}

const tag = `v${newVersion}`;

// Update package.json
pkg.version = newVersion;
await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Bumped version: ${major}.${minor}.${patch} -> ${newVersion}`);

// Commit, tag, push
const cmds: string[][] = [
  ["git", "add", "package.json"],
  ["git", "commit", "-m", `release: ${tag}`],
  ["git", "tag", "-a", tag, "-m", `Release ${tag}`],
  ["git", "push", "origin", "main"],
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

console.log(`\n${tag} released. GitHub Actions will build and publish.`);
