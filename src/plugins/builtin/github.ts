import { c } from '../../utils/color.ts';
import { exec } from '../../utils/exec.ts';
import { log } from '../../utils/logger.ts';
import type { ArboristPlugin } from '../types.ts';

interface PrInfo {
  number: number;
  state: string;
  url: string;
  title: string;
  ciStatus?: string;
}

async function getPrForBranch(branch: string, cwd: string): Promise<PrInfo | null> {
  const result = await exec(
    ['gh', 'pr', 'view', branch, '--json', 'number,state,url,title,statusCheckRollup'],
    { cwd },
  );

  if (result.exitCode !== 0) return null;

  try {
    const data = JSON.parse(result.stdout);

    let ciStatus: string | undefined;
    if (data.statusCheckRollup?.length > 0) {
      const conclusions = data.statusCheckRollup.map(
        (check: { conclusion?: string; status?: string }) => check.conclusion ?? check.status,
      );
      if (conclusions.every((s: string) => s === 'SUCCESS')) {
        ciStatus = 'SUCCESS';
      } else if (conclusions.some((s: string) => s === 'FAILURE')) {
        ciStatus = 'FAILURE';
      } else {
        ciStatus = 'PENDING';
      }
    }

    return {
      number: data.number,
      state: data.state,
      url: data.url,
      title: data.title,
      ciStatus,
    };
  } catch {
    return null;
  }
}

const githubPlugin: ArboristPlugin = {
  name: 'github',
  version: '1.0.0',
  hooks: {
    async 'status:extend'(ctx, wt) {
      if (wt.isMain || wt.isBare || !wt.branch) return [];

      const pr = await getPrForBranch(wt.branch, ctx.gitRoot);
      if (!pr) return [];

      const stateLabel =
        pr.state === 'MERGED'
          ? c.green('merged')
          : pr.state === 'CLOSED'
            ? c.red('closed')
            : c.cyan('open');

      const ciLabel = pr.ciStatus
        ? pr.ciStatus === 'SUCCESS'
          ? c.green('✓')
          : pr.ciStatus === 'FAILURE'
            ? c.red('✗')
            : c.yellow('○')
        : '';

      return [
        {
          label: 'PR',
          value: `#${pr.number} ${stateLabel}${ciLabel ? ` ${ciLabel}` : ''}`,
        },
      ];
    },

    async 'worktree:created'(ctx, wt) {
      // Check if there's an existing PR for this branch
      const pr = await getPrForBranch(wt.branch, ctx.gitRoot);
      if (pr) {
        log.info(`  PR #${pr.number}: ${c.cyan(pr.title)} (${pr.state.toLowerCase()})`);
      }
    },
  },

  commands: [
    {
      name: 'pr',
      description: 'Show PR status for all worktrees',
      async run(ctx, _args) {
        const { listWorktrees } = await import('../../core/git.ts');
        const worktrees = await listWorktrees(ctx.gitRoot);

        for (const wt of worktrees) {
          if (wt.isBare || wt.isMain || !wt.branch) continue;

          const pr = await getPrForBranch(wt.branch, ctx.gitRoot);
          if (pr) {
            const stateColor =
              pr.state === 'MERGED' ? c.green : pr.state === 'CLOSED' ? c.red : c.cyan;

            const ciIcon = pr.ciStatus
              ? pr.ciStatus === 'SUCCESS'
                ? c.green(' ✓')
                : pr.ciStatus === 'FAILURE'
                  ? c.red(' ✗')
                  : c.yellow(' ○')
              : '';

            console.log(
              `${c.branch(wt.branch)} → ${stateColor(`#${pr.number}`)}${ciIcon} ${c.dim(pr.title)}`,
            );
          } else {
            console.log(`${c.branch(wt.branch)} → ${c.dim('no PR')}`);
          }
        }
      },
    },
  ],
};

export default githubPlugin;
