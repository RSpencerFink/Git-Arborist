import type { GwContext } from "../core/context.ts";
import { getWorktrees, getCurrentWorktree } from "../core/worktree.ts";
import { getBranchStatus, type BranchStatus } from "../core/git.ts";
import { c } from "../utils/color.ts";

export async function ls(ctx: GwContext, _args: string[]): Promise<void> {
  const worktrees = await getWorktrees(ctx);

  if (worktrees.length === 0) {
    console.log(c.dim("No worktrees found."));
    return;
  }

  const currentWt = await getCurrentWorktree(ctx);

  // Gather status for each non-bare worktree
  const rows: string[] = [];

  for (const wt of worktrees) {
    if (wt.isBare) continue;

    const isCurrent = currentWt?.path === wt.path;
    const marker = isCurrent ? c.green("*") : " ";

    let branchDisplay = wt.isDetached
      ? c.dim(`(detached ${wt.head})`)
      : c.branch(wt.branch);
    if (wt.isMain) {
      branchDisplay += c.dim(" [main]");
    }

    let statusParts: string[] = [];
    try {
      const status = await getBranchStatus(wt.branch, wt.path);
      if (status.dirty) {
        const parts: string[] = [];
        if (status.staged > 0) parts.push(c.green(`+${status.staged}`));
        if (status.modified > 0) parts.push(c.yellow(`~${status.modified}`));
        if (status.untracked > 0) parts.push(c.dim(`?${status.untracked}`));
        statusParts.push(parts.join(" "));
      }
      if (status.ahead > 0 || status.behind > 0) {
        const sync: string[] = [];
        if (status.ahead > 0) sync.push(c.green(`↑${status.ahead}`));
        if (status.behind > 0) sync.push(c.red(`↓${status.behind}`));
        statusParts.push(sync.join(" "));
      }
    } catch {
      // Skip status on error
    }

    const statusStr = statusParts.length > 0 ? ` ${statusParts.join(" ")}` : "";
    rows.push(`${marker} ${branchDisplay}${statusStr}`);
    rows.push(`  ${c.dim(wt.path)}`);
  }

  console.log(rows.join("\n"));
}
