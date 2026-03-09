import { deleteBranch } from '../core/branch.ts';
import type { ArboristContext } from '../core/context.ts';
import { deleteWorktree, findWorktree, getWorktrees } from '../core/worktree.ts';
import { c } from '../utils/color.ts';
import { log } from '../utils/logger.ts';

interface RmArgs {
  name?: string;
  force: boolean;
  branch: boolean;
}

export function parseRmArgs(args: string[]): RmArgs {
  let name: string | undefined;
  let force = false;
  let branch = false;

  for (const arg of args) {
    if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--branch') {
      branch = true;
    } else if (!name) {
      name = arg;
    }
  }

  return { name, force, branch };
}

interface RmJsonResult {
  branch: string;
  path: string;
  deleted_branch?: string;
  branch_delete_error?: string;
}

export async function rmJson(ctx: ArboristContext, args: string[]): Promise<RmJsonResult> {
  const parsed = parseRmArgs(args);

  if (!parsed.name) {
    throw new Error('Worktree name required in --json mode. Usage: arb rm <name> --json');
  }

  const { branch: removedBranch, path: removedPath } = await deleteWorktree(ctx, parsed.name, {
    force: parsed.force,
  });

  const result: RmJsonResult = { branch: removedBranch, path: removedPath };

  if (parsed.branch && removedBranch) {
    try {
      await deleteBranch(removedBranch, true, ctx.gitRoot);
      result.deleted_branch = removedBranch;
    } catch (err) {
      result.branch_delete_error = (err as Error).message;
    }
  }

  return result;
}

export async function rm(ctx: ArboristContext, args: string[]): Promise<void> {
  const parsed = parseRmArgs(args);

  if (!parsed.name) {
    // Interactive selection
    const worktrees = await getWorktrees(ctx);
    const nonMain = worktrees.filter((wt) => !wt.isMain && !wt.isBare);

    if (nonMain.length === 0) {
      log.info('No worktrees to remove.');
      return;
    }

    // Use clack for interactive selection
    const { select, isCancel } = await import('@clack/prompts');
    const selected = await select({
      message: 'Select worktree to remove:',
      options: nonMain.map((wt) => ({
        value: wt.branch,
        label: `${wt.branch} (${wt.path})`,
      })),
    });

    if (isCancel(selected)) {
      log.dim('Cancelled.');
      return;
    }

    parsed.name = selected as string;
  }

  const { branch: removedBranch, path: removedPath } = await deleteWorktree(ctx, parsed.name, {
    force: parsed.force,
  });

  log.success(`Removed worktree ${c.path(removedPath)}`);

  if (parsed.branch && removedBranch) {
    try {
      await deleteBranch(removedBranch, parsed.force, ctx.gitRoot);
      log.success(`Deleted branch ${c.branch(removedBranch)}`);
    } catch (err) {
      log.warn(`Could not delete branch ${c.branch(removedBranch)}: ${(err as Error).message}`);
    }
  }
}
