import type { GwContext } from "../core/context.ts";
import { type BranchStatus, getBranchStatus } from "../core/git.ts";
import { getCurrentWorktree, getWorktrees } from "../core/worktree.ts";
import { c } from "../utils/color.ts";

export interface StatusJsonItem {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isDetached: boolean;
  isCurrent: boolean;
  status: BranchStatus | null;
}

export async function statusJson(
  ctx: GwContext,
  _args: string[],
): Promise<StatusJsonItem[]> {
  const worktrees = await getWorktrees(ctx);
  const currentWt = await getCurrentWorktree(ctx);
  const items: StatusJsonItem[] = [];

  for (const wt of worktrees) {
    if (wt.isBare) continue;

    let status: BranchStatus | null = null;
    try {
      status = await getBranchStatus(wt.branch, wt.path);
    } catch {
      // Skip status on error
    }

    items.push({
      path: wt.path,
      branch: wt.branch,
      head: wt.head,
      isMain: wt.isMain,
      isDetached: wt.isDetached,
      isCurrent: currentWt?.path === wt.path,
      status,
    });
  }

  return items;
}

export async function status(ctx: GwContext, _args: string[]): Promise<void> {
  const worktrees = await getWorktrees(ctx);
  const currentWt = await getCurrentWorktree(ctx);

  if (worktrees.length === 0) {
    console.log(c.dim("No worktrees found."));
    return;
  }

  // Table header
  const header = [
    pad("", 3),
    pad("Branch", 30),
    pad("Head", 10),
    pad("Changes", 30),
    pad("Remote", 16),
    "Path",
  ].join("");

  console.log(c.bold(header));
  console.log(c.dim("─".repeat(100)));

  for (const wt of worktrees) {
    if (wt.isBare) continue;

    const isCurrent = currentWt?.path === wt.path;
    const marker = isCurrent ? c.green(" * ") : "   ";

    const branchCol = pad(wt.isDetached ? `(${wt.head})` : wt.branch, 30);

    const headCol = pad(wt.head, 10);

    let changesCol = "";
    let remoteCol = "";

    try {
      const branchStatus = await getBranchStatus(wt.branch, wt.path);

      if (branchStatus.dirty) {
        const total =
          branchStatus.staged + branchStatus.modified + branchStatus.untracked;
        const parts: string[] = [];
        if (branchStatus.staged > 0)
          parts.push(`${branchStatus.staged} staged`);
        if (branchStatus.modified > 0)
          parts.push(`${branchStatus.modified} modified`);
        if (branchStatus.untracked > 0)
          parts.push(`${branchStatus.untracked} new`);
        changesCol =
          c.yellow(`${total} file${total !== 1 ? "s" : ""}`) +
          c.dim(` (${parts.join(", ")})`);
      } else {
        changesCol = c.green("clean");
      }

      if (branchStatus.ahead === 0 && branchStatus.behind === 0) {
        remoteCol = c.green("up to date");
      } else {
        const parts: string[] = [];
        if (branchStatus.ahead > 0) parts.push(`${branchStatus.ahead} to push`);
        if (branchStatus.behind > 0)
          parts.push(`${branchStatus.behind} to pull`);
        remoteCol =
          branchStatus.behind > 0
            ? c.yellow(parts.join(", "))
            : c.green(parts.join(", "));
      }
    } catch {
      changesCol = c.dim("?");
      remoteCol = c.dim("?");
    }

    const row = [
      marker,
      isCurrent ? c.green(branchCol) : branchCol,
      c.dim(headCol),
      pad(changesCol, 30),
      pad(remoteCol, 16),
      c.dim(wt.path),
    ].join("");

    console.log(row);
  }
}

function pad(str: string, width: number): string {
  // Strip ANSI codes for length calculation
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape stripping requires control chars
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "");
  const padding = Math.max(0, width - stripped.length);
  return str + " ".repeat(padding);
}
