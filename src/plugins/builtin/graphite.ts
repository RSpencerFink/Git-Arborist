import { c } from '../../utils/color.ts';
import { exec } from '../../utils/exec.ts';
import { log } from '../../utils/logger.ts';
import type { GwPlugin } from '../types.ts';

interface StackEntry {
  branch: string;
  pr?: number;
  title?: string;
  needsRestack?: boolean;
}

async function isGraphiteAvailable(cwd: string): Promise<boolean> {
  const result = await exec(['gt', '--version'], { cwd });
  return result.exitCode === 0;
}

async function getStack(cwd: string): Promise<StackEntry[]> {
  const result = await exec(['gt', 'log', 'short', '--json'], { cwd });
  if (result.exitCode !== 0) return [];

  try {
    const data = JSON.parse(result.stdout);
    if (!Array.isArray(data)) return [];

    return data.map((entry: Record<string, unknown>) => ({
      branch: entry.branch as string,
      pr: entry.pr_number as number | undefined,
      title: entry.title as string | undefined,
      needsRestack: entry.needs_restack as boolean | undefined,
    }));
  } catch {
    return [];
  }
}

async function getStackForBranch(
  branch: string,
  cwd: string,
): Promise<{ stack: StackEntry[]; position: number } | null> {
  const result = await exec(['gt', 'log', 'short', '--json', '--stack'], {
    cwd,
  });
  if (result.exitCode !== 0) return null;

  try {
    const data = JSON.parse(result.stdout);
    if (!Array.isArray(data)) return null;

    const stack = data.map((entry: Record<string, unknown>) => ({
      branch: entry.branch as string,
      pr: entry.pr_number as number | undefined,
      title: entry.title as string | undefined,
      needsRestack: entry.needs_restack as boolean | undefined,
    }));

    const position = stack.findIndex((e: StackEntry) => e.branch === branch);
    if (position === -1) return null;

    return { stack, position };
  } catch {
    return null;
  }
}

const graphitePlugin: GwPlugin = {
  name: 'graphite',
  version: '1.0.0',

  async activate(ctx) {
    const available = await isGraphiteAvailable(ctx.gitRoot);
    if (!available) {
      log.warn('Graphite CLI (gt) not found. Graphite plugin features will be limited.');
    }
  },

  hooks: {
    async 'status:extend'(ctx, wt) {
      if (wt.isBare || !wt.branch) return [];

      const info = await getStackForBranch(wt.branch, ctx.gitRoot);
      if (!info) return [];

      const posLabel = `${info.position + 1}/${info.stack.length}`;
      const needsRestack = info.stack[info.position]?.needsRestack;

      return [
        {
          label: 'Stack',
          value: `${posLabel}${needsRestack ? c.yellow(' ⚠ restack') : ''}`,
        },
      ];
    },
  },

  commands: [
    {
      name: 'stack',
      description: 'Show Graphite stack for current or specified branch',
      async run(ctx, args) {
        const { getCurrentBranch } = await import('../../core/branch.ts');
        const branch = args[0] ?? (await getCurrentBranch(ctx.gitRoot));

        const info = await getStackForBranch(branch, ctx.gitRoot);
        if (!info) {
          log.dim(`Branch ${c.branch(branch)} is not part of a Graphite stack.`);
          return;
        }

        console.log(c.bold(`Stack (${info.stack.length} branches):`));
        console.log();

        for (let i = info.stack.length - 1; i >= 0; i--) {
          const entry = info.stack[i];
          const isCurrent = i === info.position;
          const marker = isCurrent ? c.green('→') : ' ';
          const branchLabel = isCurrent ? c.bold(c.branch(entry.branch)) : c.branch(entry.branch);

          const prLabel = entry.pr ? c.dim(` #${entry.pr}`) : '';
          const restackLabel = entry.needsRestack ? c.yellow(' ⚠ needs restack') : '';
          const connector = i > 0 ? c.dim('  │') : '';

          console.log(`${marker} ${branchLabel}${prLabel}${restackLabel}`);
          if (connector) console.log(connector);
        }
      },
    },
    {
      name: 'submit',
      description: 'Submit current stack with Graphite',
      async run(_ctx, _args) {
        const result = await exec(['gt', 'stack', 'submit']);
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
        if (result.exitCode !== 0) {
          process.exit(result.exitCode);
        }
      },
    },
  ],
};

export default graphitePlugin;
