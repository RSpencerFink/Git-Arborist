import type { GwContext } from '../core/context.ts';
import { findWorktree, getWorktrees } from '../core/worktree.ts';
import { log } from '../utils/logger.ts';

interface GoArgs {
  name?: string;
  printPath: boolean;
}

export function parseGoArgs(args: string[]): GoArgs {
  let name: string | undefined;
  let printPath = false;

  for (const arg of args) {
    if (arg === '--print-path') {
      printPath = true;
    } else if (!name) {
      name = arg;
    }
  }

  return { name, printPath };
}

export async function go(ctx: GwContext, args: string[]): Promise<void> {
  const { name, printPath } = parseGoArgs(args);
  const worktrees = await getWorktrees(ctx);
  const nonBare = worktrees.filter((wt) => !wt.isBare);

  if (!name) {
    // Interactive selection using clack
    const { select, isCancel } = await import('@clack/prompts');
    const selected = await select({
      message: 'Select worktree:',
      options: nonBare.map((wt) => ({
        value: wt.path,
        label: `${wt.branch}${wt.isMain ? ' (main)' : ''}`,
        hint: wt.path,
      })),
    });

    if (isCancel(selected)) {
      process.exit(1);
    }

    // Print path for shell integration to cd into
    console.log(selected);
    return;
  }

  const wt = findWorktree(nonBare, name);
  if (!wt) {
    log.error(`Worktree not found: ${name}`);
    process.exit(1);
  }

  // When called with --print-path (from shell function), just print the path
  if (printPath) {
    console.log(wt.path);
    return;
  }

  // Otherwise print path for shell integration
  console.log(wt.path);
}
