import type { GwContext } from "../core/context.ts";
import { pruneWorktrees } from "../core/git.ts";
import { execOrThrow } from "../utils/exec.ts";
import { log } from "../utils/logger.ts";

export async function gc(ctx: GwContext, _args: string[]): Promise<void> {
  log.info("Running garbage collection...");

  // Prune worktree metadata
  await pruneWorktrees(ctx.gitRoot);
  log.success("Pruned stale worktree references");

  // Run git gc
  await execOrThrow(["git", "gc", "--prune=now"], { cwd: ctx.gitRoot });
  log.success("Git garbage collection complete");
}
