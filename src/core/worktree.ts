import { basename } from 'node:path';
import type { ArboristContext } from './context.ts';
import {
  type WorktreeInfo,
  getDefaultBranch,
  addWorktree as gitAddWorktree,
  listWorktrees as gitListWorktrees,
  removeWorktree as gitRemoveWorktree,
} from './git.ts';
import { resolveWorktreePath } from './paths.ts';

export type { WorktreeInfo };

export async function createWorktree(
  ctx: ArboristContext,
  branch: string,
  options?: { createBranch?: boolean; base?: string },
): Promise<WorktreeInfo> {
  const worktreePath = resolveWorktreePath(ctx.config, ctx.gitRoot, branch);

  await gitAddWorktree(worktreePath, branch, {
    createBranch: options?.createBranch,
    base: options?.base,
    cwd: ctx.gitRoot,
  });

  return {
    path: worktreePath,
    branch,
    head: '',
    isBare: false,
    isMain: false,
    isDetached: false,
  };
}

export async function deleteWorktree(
  ctx: ArboristContext,
  nameOrPath: string,
  options?: { force?: boolean; deleteBranch?: boolean },
): Promise<{ branch: string; path: string }> {
  const worktrees = await gitListWorktrees(ctx.gitRoot);
  const wt = findWorktree(worktrees, nameOrPath);

  if (!wt) {
    throw new Error(`Worktree not found: ${nameOrPath}`);
  }

  if (wt.isMain) {
    throw new Error('Cannot remove the main worktree');
  }

  await gitRemoveWorktree(wt.path, options?.force, ctx.gitRoot);

  return { branch: wt.branch, path: wt.path };
}

export async function getWorktrees(ctx: ArboristContext): Promise<WorktreeInfo[]> {
  return gitListWorktrees(ctx.gitRoot);
}

export async function getMainWorktree(ctx: ArboristContext): Promise<WorktreeInfo | undefined> {
  const worktrees = await gitListWorktrees(ctx.gitRoot);
  return worktrees.find((wt) => wt.isMain);
}

export function findWorktree(
  worktrees: WorktreeInfo[],
  nameOrBranch: string,
): WorktreeInfo | undefined {
  // Exact path match
  const exactPath = worktrees.find((wt) => wt.path === nameOrBranch);
  if (exactPath) return exactPath;

  // Exact branch match
  const exactBranch = worktrees.find((wt) => wt.branch === nameOrBranch);
  if (exactBranch) return exactBranch;

  // Match by directory name
  const byDirName = worktrees.find((wt) => basename(wt.path) === nameOrBranch);
  if (byDirName) return byDirName;

  // Fuzzy: branch ends with the name
  const fuzzy = worktrees.find((wt) => wt.branch.endsWith(`/${nameOrBranch}`));
  if (fuzzy) return fuzzy;

  // Fuzzy: branch contains the name
  const contains = worktrees.find((wt) => wt.branch.includes(nameOrBranch));
  return contains;
}

export async function getCurrentWorktree(ctx: ArboristContext): Promise<WorktreeInfo | undefined> {
  const worktrees = await gitListWorktrees(ctx.gitRoot);
  return worktrees.find((wt) => wt.path === ctx.cwd || ctx.cwd.startsWith(`${wt.path}/`));
}
