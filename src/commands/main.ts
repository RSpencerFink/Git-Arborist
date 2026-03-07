import type { GwContext } from '../core/context.ts';
import { getMainWorktree } from '../core/worktree.ts';
import { log } from '../utils/logger.ts';
import { ensureShellIntegration } from './shellSetup.ts';

export async function main(ctx: GwContext, args: string[]): Promise<void> {
  // Skip check when called from shell wrapper (--print-path)
  if (!args.includes('--print-path')) {
    await ensureShellIntegration();
  }
  const mainWt = await getMainWorktree(ctx);

  if (!mainWt) {
    log.error('Could not find main worktree.');
    process.exit(1);
  }

  // Print path for shell integration to cd into
  console.log(mainWt.path);
}
