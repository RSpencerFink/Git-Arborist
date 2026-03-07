import { existsSync } from "node:fs";
import { join } from "node:path";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

export function detectPackageManager(dir: string): PackageManager {
  if (existsSync(join(dir, "bun.lock")) || existsSync(join(dir, "bun.lockb")))
    return "bun";
  if (existsSync(join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(dir, "yarn.lock"))) return "yarn";
  return "npm";
}

export function isInsideTmux(): boolean {
  return !!process.env.TMUX;
}
