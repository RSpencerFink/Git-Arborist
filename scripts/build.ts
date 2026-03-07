#!/usr/bin/env bun
/**
 * Cross-compiles gw for all supported platforms and generates SHA256 checksums.
 */
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const entrypoint = resolve(root, "src/index.ts");

const targets = [
  { bun: "bun-darwin-arm64", out: "gw-darwin-arm64" },
  { bun: "bun-darwin-x64", out: "gw-darwin-x64" },
  { bun: "bun-linux-arm64", out: "gw-linux-arm64" },
  { bun: "bun-linux-x64", out: "gw-linux-x64" },
] as const;

// Ensure version.ts is up to date
const versionScript = resolve(root, "scripts/version.ts");
const versionProc = Bun.spawn(["bun", "run", versionScript], {
  stdout: "inherit",
  stderr: "inherit",
});
await versionProc.exited;
if (versionProc.exitCode !== 0) {
  console.error("Failed to generate version.ts");
  process.exit(1);
}

await mkdir(dist, { recursive: true });

for (const target of targets) {
  const outfile = resolve(dist, target.out);
  console.log(`Building ${target.out} (${target.bun})...`);

  const proc = Bun.spawn(
    [
      "bun",
      "build",
      entrypoint,
      "--compile",
      `--target=${target.bun}`,
      `--outfile=${outfile}`,
    ],
    { stdout: "inherit", stderr: "inherit" },
  );
  await proc.exited;

  if (proc.exitCode !== 0) {
    console.error(`Failed to build ${target.out}`);
    process.exit(1);
  }

  // Generate SHA256 checksum
  const binary = Bun.file(outfile);
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(await binary.arrayBuffer());
  const sha256 = hash.digest("hex");
  await Bun.write(`${outfile}.sha256`, `${sha256}  ${target.out}\n`);
  console.log(`  SHA256: ${sha256}`);
}

console.log("\nAll builds complete. Artifacts in dist/");
