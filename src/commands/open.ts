import type { ArboristContext } from '../core/context.ts';
import { findWorktree, getWorktrees } from '../core/worktree.ts';
import { c } from '../utils/color.ts';
import { exec } from '../utils/exec.ts';
import { log } from '../utils/logger.ts';

export async function open(ctx: ArboristContext, args: string[]): Promise<void> {
  const name = args[0];

  if (!name) {
    throw new Error('Worktree name required. Usage: arb open <name>');
  }

  const worktrees = await getWorktrees(ctx);
  const wt = findWorktree(worktrees, name);

  if (!wt) {
    throw new Error(`Worktree not found: ${name}`);
  }

  const editor = ctx.config.editor ?? process.env.EDITOR ?? 'code';
  log.info(`Opening ${c.branch(wt.branch)} in ${editor}...`);

  await exec([editor, wt.path]);
}
