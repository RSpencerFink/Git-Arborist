import type { GwContext } from '../core/context.ts';
import { ensureShellIntegrationActive } from './shellSetup.ts';

export async function dash(ctx: GwContext, args: string[]): Promise<void> {
  await ensureShellIntegrationActive();

  const showPr = args.includes('--pr') || ctx.config.plugins.github?.enabled === true;
  const showGraphite = args.includes('--graphite') || ctx.config.plugins.graphite?.enabled === true;

  const { renderDashboard } = await import('../tui/dashboard.tsx');
  renderDashboard(ctx, { showPr, showGraphite });
}
