import { resolve } from "node:path";
import type { GwConfig } from "./config.ts";
import { renderTemplate } from "../utils/template.ts";

export function resolveWorktreePath(
  config: GwConfig,
  gitRoot: string,
  branch: string,
): string {
  const rendered = renderTemplate(config.worktree_path, { branch });
  return resolve(gitRoot, rendered);
}

export function worktreeNameFromBranch(branch: string): string {
  // Take the last segment of a branch path for display
  const parts = branch.split("/");
  return parts[parts.length - 1];
}

export function sanitizeBranchForPath(branch: string): string {
  return branch
    .replace(/[^a-zA-Z0-9_\-/.]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
