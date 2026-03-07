import type { GwContext } from '../core/context.ts';
import { getBranchStatus } from '../core/git.ts';
import { getCurrentWorktree, getWorktrees } from '../core/worktree.ts';
import { c } from '../utils/color.ts';

export async function status(ctx: GwContext, _args: string[]): Promise<void> {
  const worktrees = await getWorktrees(ctx);
  const currentWt = await getCurrentWorktree(ctx);

  if (worktrees.length === 0) {
    console.log(c.dim('No worktrees found.'));
    return;
  }

  // Table header
  const header = [
    pad('', 3),
    pad('Branch', 30),
    pad('Head', 10),
    pad('Status', 15),
    pad('Sync', 12),
    'Path',
  ].join('');

  console.log(c.bold(header));
  console.log(c.dim('─'.repeat(100)));

  for (const wt of worktrees) {
    if (wt.isBare) continue;

    const isCurrent = currentWt?.path === wt.path;
    const marker = isCurrent ? c.green(' * ') : '   ';

    const branchCol = pad(wt.isDetached ? `(${wt.head})` : wt.branch, 30);

    const headCol = pad(wt.head, 10);

    let statusCol = '';
    let syncCol = '';

    try {
      const branchStatus = await getBranchStatus(wt.branch, wt.path);

      if (branchStatus.dirty) {
        const parts: string[] = [];
        if (branchStatus.staged > 0) parts.push(c.green(`+${branchStatus.staged}`));
        if (branchStatus.modified > 0) parts.push(c.yellow(`~${branchStatus.modified}`));
        if (branchStatus.untracked > 0) parts.push(c.dim(`?${branchStatus.untracked}`));
        statusCol = parts.join(' ');
      } else {
        statusCol = c.green('clean');
      }

      const syncParts: string[] = [];
      if (branchStatus.ahead > 0) syncParts.push(c.green(`↑${branchStatus.ahead}`));
      if (branchStatus.behind > 0) syncParts.push(c.red(`↓${branchStatus.behind}`));
      syncCol = syncParts.join(' ') || c.dim('—');
    } catch {
      statusCol = c.dim('?');
      syncCol = c.dim('?');
    }

    const row = [
      marker,
      isCurrent ? c.green(branchCol) : branchCol,
      c.dim(headCol),
      pad(statusCol, 15),
      pad(syncCol, 12),
      c.dim(wt.path),
    ].join('');

    console.log(row);
  }
}

function pad(str: string, width: number): string {
  // Strip ANSI codes for length calculation
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape stripping requires control chars
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, width - stripped.length);
  return str + ' '.repeat(padding);
}
