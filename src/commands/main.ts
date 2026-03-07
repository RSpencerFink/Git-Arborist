import type { GwContext } from "../core/context.ts";
import { getMainWorktree } from "../core/worktree.ts";
import { log } from "../utils/logger.ts";

export async function main(ctx: GwContext, _args: string[]): Promise<void> {
  const mainWt = await getMainWorktree(ctx);

  if (!mainWt) {
    log.error("Could not find main worktree.");
    process.exit(1);
  }

  // Print path for shell integration to cd into
  console.log(mainWt.path);
}
