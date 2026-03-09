import type { ArboristContext } from '../core/context.ts';
import { c } from '../utils/color.ts';
import { log } from '../utils/logger.ts';

interface PluginJsonItem {
  name: string;
  enabled: boolean;
  builtin: boolean;
}

export async function pluginJson(ctx: ArboristContext, args: string[]): Promise<PluginJsonItem[]> {
  const builtins = ['git', 'deps', 'env', 'tmux', 'github', 'graphite'];
  return builtins.map((name) => {
    const config = ctx.config.plugins[name];
    return {
      name,
      enabled: config?.enabled ?? name === 'git',
      builtin: true,
    };
  });
}

export async function plugin(ctx: ArboristContext, args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'list': {
      console.log(c.bold('Plugins:'));

      // Built-in plugins
      const builtins = ['git', 'deps', 'env', 'tmux', 'github', 'graphite'];
      for (const name of builtins) {
        const config = ctx.config.plugins[name];
        const enabled = config?.enabled ?? name === 'git';
        const status = enabled ? c.green('enabled') : c.dim('disabled');
        const label = name === 'git' ? `${name} ${c.dim('(always active)')}` : name;
        console.log(`  ${status} ${label}`);
      }
      break;
    }
    case 'add': {
      log.warn('Plugin installation is not yet implemented.');
      log.dim('Enable built-in plugins in .arborist.toml under [plugins.<name>]');
      break;
    }
    case 'remove': {
      log.warn('Plugin removal is not yet implemented.');
      log.dim('Disable plugins in .arborist.toml by setting enabled = false');
      break;
    }
    default:
      throw new Error('Usage: arb plugin <list|add|remove>');
  }
}
