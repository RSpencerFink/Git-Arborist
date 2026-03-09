import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";

const execFileAsync = promisify(execFile);

/** Augmented PATH so bun (and arb) are reachable from GUI-launched editors. */
export function getAugmentedEnv(): NodeJS.ProcessEnv {
  const home = homedir();
  const extraDirs = [
    join(home, ".bun", "bin"),
    "/opt/homebrew/bin",
    join(home, ".local", "bin"),
    "/usr/local/bin",
  ];
  const existing = process.env.PATH ?? "";
  return {
    ...process.env,
    PATH: [...extraDirs, existing].join(":"),
    NO_COLOR: "1",
  };
}

const MIN_VERSION = "0.1.9";

let cachedPath: string | undefined;

export async function getArboristBinaryPath(): Promise<string> {
  if (cachedPath) return cachedPath;

  const configPath = vscode.workspace
    .getConfiguration("arborist")
    .get<string>("binaryPath");

  if (configPath) {
    await validateBinary(configPath);
    cachedPath = configPath;
    return configPath;
  }

  const detected = await detectBinary();
  if (detected) {
    cachedPath = detected;
    return detected;
  }

  throw new ArboristBinaryNotFoundError();
}

export function clearBinaryCache(): void {
  cachedPath = undefined;
}

async function detectBinary(): Promise<string | undefined> {
  // Try `which` first (works when PATH is inherited)
  try {
    const { stdout } = await execFileAsync("which", ["arb"], {
      env: getAugmentedEnv(),
    });
    const found = stdout.trim();
    if (found) {
      await validateBinary(found);
      return found;
    }
  } catch {
    // not found on PATH
  }

  // GUI apps on macOS don't inherit shell PATH — check common locations
  const home = homedir();
  const candidates = [
    join(home, ".bun", "bin", "arb"),
    "/usr/local/bin/arb",
    join(home, ".local", "bin", "arb"),
    "/opt/homebrew/bin/arb",
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        await validateBinary(candidate);
        return candidate;
      } catch {
        // invalid binary at this path, try next
      }
    }
  }

  return undefined;
}

async function validateBinary(path: string): Promise<void> {
  try {
    const { stdout } = await execFileAsync(path, ["--version", "--json"], {
      env: getAugmentedEnv(),
    });
    const data = JSON.parse(stdout.trim());
    const version = data.version;
    if (!version) {
      throw new Error("Could not determine arb version");
    }
    if (compareVersions(version, MIN_VERSION) < 0) {
      throw new Error(
        `arb version ${version} is too old. Minimum required: ${MIN_VERSION}`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("too old")) throw err;
    throw new Error(`Invalid arb binary at ${path}: ${(err as Error).message}`);
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

export class ArboristBinaryNotFoundError extends Error {
  constructor() {
    super("arb binary not found. Install it with: bun add -g git-arborist");
    this.name = "ArboristBinaryNotFoundError";
  }
}
