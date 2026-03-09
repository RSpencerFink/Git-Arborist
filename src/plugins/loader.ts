import type { ArboristContext } from '../core/context.ts';
import { HookRegistry } from './hooks.ts';
import type { ArboristPlugin } from './types.ts';

export async function loadPlugins(ctx: ArboristContext): Promise<HookRegistry> {
  const registry = new HookRegistry();

  // Load built-in plugins based on config
  const builtinPlugins: Record<string, () => Promise<ArboristPlugin>> = {
    git: async () => (await import('./builtin/git.ts')).default,
    deps: async () => (await import('./builtin/deps.ts')).default,
    env: async () => (await import('./builtin/env.ts')).default,
    tmux: async () => (await import('./builtin/tmux.ts')).default,
  };

  // git plugin is always active
  const gitPlugin = await builtinPlugins.git();
  registry.register(gitPlugin);

  // Load configured plugins
  for (const [name, config] of Object.entries(ctx.config.plugins)) {
    if (!config.enabled || name === 'git') continue;

    const loader = builtinPlugins[name];
    if (loader) {
      const plugin = await loader();
      if (plugin.activate) {
        await plugin.activate(ctx);
      }
      registry.register(plugin);
    }
  }

  return registry;
}
