import type { ArboristContext } from '../core/context.ts';
import { type BranchStatus, getBranchStatus } from '../core/git.ts';
import type { WorktreeInfo } from '../core/git.ts';
import { getCurrentWorktree, getWorktrees } from '../core/worktree.ts';
import { c } from '../utils/color.ts';

export interface LsJsonItem {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isDetached: boolean;
  isCurrent: boolean;
  status: BranchStatus | null;
}

async function gatherWorktreeData(ctx: ArboristContext): Promise<LsJsonItem[]> {
  const worktrees = await getWorktrees(ctx);
  const currentWt = await getCurrentWorktree(ctx);
  const items: LsJsonItem[] = [];

  for (const wt of worktrees) {
    if (wt.isBare) continue;

    let status: BranchStatus | null = null;
    try {
      status = await getBranchStatus(wt.branch, wt.path);
    } catch {
      // Skip status on error
    }

    items.push({
      path: wt.path,
      branch: wt.branch,
      head: wt.head,
      isMain: wt.isMain,
      isDetached: wt.isDetached,
      isCurrent: currentWt?.path === wt.path,
      status,
    });
  }

  return items;
}

export async function lsJson(ctx: ArboristContext, _args: string[]): Promise<LsJsonItem[]> {
  return gatherWorktreeData(ctx);
}

export async function ls(ctx: ArboristContext, _args: string[]): Promise<void> {
  const items = await gatherWorktreeData(ctx);

  if (items.length === 0) {
    console.log(c.dim('No worktrees found.'));
    return;
  }

  const rows: string[] = [];

  for (const item of items) {
    const marker = item.isCurrent ? c.green('*') : ' ';

    let branchDisplay = item.isDetached ? c.dim(`(detached ${item.head})`) : c.branch(item.branch);
    if (item.isMain) {
      branchDisplay += c.dim(' [main]');
    }

    const statusParts: string[] = [];
    if (item.status) {
      if (item.status.dirty) {
        const parts: string[] = [];
        if (item.status.staged > 0) parts.push(c.green(`+${item.status.staged}`));
        if (item.status.modified > 0) parts.push(c.yellow(`~${item.status.modified}`));
        if (item.status.untracked > 0) parts.push(c.dim(`?${item.status.untracked}`));
        statusParts.push(parts.join(' '));
      }
      if (item.status.ahead > 0 || item.status.behind > 0) {
        const sync: string[] = [];
        if (item.status.ahead > 0) sync.push(c.green(`↑${item.status.ahead}`));
        if (item.status.behind > 0) sync.push(c.red(`↓${item.status.behind}`));
        statusParts.push(sync.join(' '));
      }
    }

    const statusStr = statusParts.length > 0 ? ` ${statusParts.join(' ')}` : '';
    rows.push(`${marker} ${branchDisplay}${statusStr}`);
    rows.push(`  ${c.dim(item.path)}`);
  }

  console.log(rows.join('\n'));
}
