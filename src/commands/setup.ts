import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GwContext } from "../core/context.ts";
import {
  getWorktrees,
  findWorktree,
  getMainWorktree,
} from "../core/worktree.ts";
import { runSetupHooks } from "../setup/runner.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

export async function setup(ctx: GwContext, args: string[]): Promise<void> {
  const name = args[0];

  if (!name) {
    throw new Error("Worktree name required. Usage: gw setup <name>");
  }

  const worktrees = await getWorktrees(ctx);
  const wt = findWorktree(worktrees, name);

  if (!wt) {
    throw new Error(`Worktree not found: ${name}`);
  }

  const mainWt = await getMainWorktree(ctx);

  log.info(`Running setup hooks for ${c.branch(wt.branch)}...`);
  await runSetupHooks(ctx, wt.path, mainWt?.path);
  log.success(`Setup complete for ${c.branch(wt.branch)}`);
}
