import type { GwContext } from "../core/context.ts";
import { getWorktrees } from "../core/worktree.ts";
import { getDefaultBranch, isMerged } from "../core/branch.ts";
import { removeWorktree, pruneWorktrees } from "../core/git.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

export async function prune(ctx: GwContext, args: string[]): Promise<void> {
  const dryRun = args.includes("--dry-run") || args.includes("-n");

  // First, prune stale worktree references
  await pruneWorktrees(ctx.gitRoot);

  const worktrees = await getWorktrees(ctx);
  const defaultBranch = await getDefaultBranch(ctx.gitRoot);

  const candidates: { branch: string; path: string; reason: string }[] = [];

  for (const wt of worktrees) {
    if (wt.isMain || wt.isBare || !wt.branch) continue;

    try {
      const merged = await isMerged(wt.branch, defaultBranch, ctx.gitRoot);
      if (merged) {
        candidates.push({
          branch: wt.branch,
          path: wt.path,
          reason: `merged into ${defaultBranch}`,
        });
      }
    } catch {
      // Branch may have been deleted upstream
    }
  }

  if (candidates.length === 0) {
    log.success("Nothing to prune. All worktrees are active.");
    return;
  }

  for (const candidate of candidates) {
    if (dryRun) {
      log.info(
        `Would remove: ${c.branch(candidate.branch)} (${candidate.reason})`,
      );
      log.dim(`  ${candidate.path}`);
    } else {
      try {
        await removeWorktree(candidate.path, false, ctx.gitRoot);
        log.success(
          `Removed ${c.branch(candidate.branch)} (${candidate.reason})`,
        );
      } catch (err) {
        log.warn(
          `Could not remove ${c.branch(candidate.branch)}: ${(err as Error).message}`,
        );
      }
    }
  }

  if (dryRun) {
    log.dim(`\nRun ${c.command("gw prune")} without --dry-run to remove.`);
  }
}
