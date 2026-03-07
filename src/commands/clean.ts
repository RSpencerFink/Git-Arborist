import type { GwContext } from '../core/context.ts';
import { findWorktree, getWorktrees } from '../core/worktree.ts';
import { c } from '../utils/color.ts';
import { execOrThrow } from '../utils/exec.ts';
import { log } from '../utils/logger.ts';

export async function clean(ctx: GwContext, args: string[]): Promise<void> {
  const name = args[0];

  if (!name) {
    throw new Error('Worktree name required. Usage: gw clean <name>');
  }

  const worktrees = await getWorktrees(ctx);
  const wt = findWorktree(worktrees, name);

  if (!wt) {
    throw new Error(`Worktree not found: ${name}`);
  }

  log.info(`Cleaning ${c.branch(wt.branch)}...`);

  await execOrThrow(['git', 'checkout', '.'], { cwd: wt.path });
  await execOrThrow(['git', 'clean', '-fd'], { cwd: wt.path });

  log.success(`Worktree ${c.branch(wt.branch)} reset to clean state`);
}
