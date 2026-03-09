import type { ArboristContext } from '../core/context.ts';
import type { WorktreeInfo } from '../core/git.ts';
import type { ArboristPlugin } from './types.ts';

type HookName = keyof NonNullable<ArboristPlugin['hooks']>;

export class HookRegistry {
  private plugins: ArboristPlugin[] = [];

  register(plugin: ArboristPlugin): void {
    this.plugins.push(plugin);
  }

  async emit<K extends HookName>(
    hookName: K,
    ctx: ArboristContext,
    ...args: Parameters<NonNullable<NonNullable<ArboristPlugin['hooks']>[K]>> extends [
      ArboristContext,
      ...infer Rest,
    ]
      ? Rest
      : never[]
  ): Promise<void> {
    for (const plugin of this.plugins) {
      const hook = plugin.hooks?.[hookName];
      if (hook) {
        await (hook as (...a: unknown[]) => Promise<unknown>)(ctx, ...args);
      }
    }
  }

  getCommands(): ArboristPlugin['commands'] {
    return this.plugins.flatMap((p) => p.commands ?? []);
  }
}
