import type { ArboristContext } from '../core/context.ts';
import { type BranchStatus, getBranchStatus, listWorktrees } from '../core/git.ts';
import { exec } from '../utils/exec.ts';
import { ensureShellIntegrationActive } from './shellSetup.ts';

interface DashWorktreeJson {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isDetached: boolean;
  isCurrent: boolean;
  status: BranchStatus | null;
  pr: { number: number; state: string; url: string; ciStatus?: string } | null;
  graphite: { stack?: string; position?: string } | null;
}

export async function dashJson(ctx: ArboristContext, args: string[]): Promise<DashWorktreeJson[]> {
  const showPr = args.includes('--pr') || ctx.config.plugins.github?.enabled === true;
  const showGraphite = args.includes('--graphite') || ctx.config.plugins.graphite?.enabled === true;

  const wts = await listWorktrees(ctx.gitRoot);
  const nonBare = wts.filter((wt) => !wt.isBare);
  const currentPath = process.cwd();

  return Promise.all(
    nonBare.map(async (wt) => {
      let status: BranchStatus | null = null;
      try {
        status = await getBranchStatus(wt.branch, wt.path);
      } catch {
        // skip
      }

      let pr: DashWorktreeJson['pr'] = null;
      if (showPr && wt.branch && !wt.isMain) {
        try {
          const result = await exec(
            ['gh', 'pr', 'view', wt.branch, '--json', 'number,state,url,statusCheckRollup'],
            { cwd: ctx.gitRoot },
          );
          if (result.exitCode === 0) {
            const data = JSON.parse(result.stdout);
            let ciStatus: string | undefined;
            if (data.statusCheckRollup?.length > 0) {
              const states = data.statusCheckRollup.map(
                (c: { conclusion?: string; status?: string }) => c.conclusion ?? c.status,
              );
              if (states.every((s: string) => s === 'SUCCESS')) ciStatus = 'SUCCESS';
              else if (states.some((s: string) => s === 'FAILURE')) ciStatus = 'FAILURE';
              else ciStatus = 'PENDING';
            }
            pr = {
              number: data.number,
              state: data.state,
              url: data.url,
              ciStatus,
            };
          }
        } catch {
          // skip
        }
      }

      let graphite: DashWorktreeJson['graphite'] = null;
      if (showGraphite && wt.branch) {
        try {
          const result = await exec(['gt', 'log', 'short', '--json'], {
            cwd: wt.path,
          });
          if (result.exitCode === 0) {
            const data = JSON.parse(result.stdout);
            if (Array.isArray(data)) {
              const entry = data.find((e: { branch?: string }) => e.branch === wt.branch);
              if (entry) {
                graphite = {
                  stack: entry.stack ?? undefined,
                  position:
                    entry.index !== undefined ? `${entry.index + 1}/${data.length}` : undefined,
                };
              }
            }
          }
        } catch {
          // skip
        }
      }

      return {
        path: wt.path,
        branch: wt.branch,
        head: wt.head,
        isMain: wt.isMain,
        isDetached: wt.isDetached,
        isCurrent: wt.path === currentPath || currentPath.startsWith(`${wt.path}/`),
        status,
        pr,
        graphite,
      };
    }),
  );
}

export async function dash(ctx: ArboristContext, args: string[]): Promise<void> {
  await ensureShellIntegrationActive();

  const showPr = args.includes('--pr') || ctx.config.plugins.github?.enabled === true;
  const showGraphite = args.includes('--graphite') || ctx.config.plugins.graphite?.enabled === true;

  const { renderDashboard } = await import('../tui/dashboard.tsx');
  renderDashboard(ctx, { showPr, showGraphite });
}
