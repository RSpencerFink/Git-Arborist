import type { GwPlugin } from "./types.ts";
import type { GwContext } from "../core/context.ts";
import type { WorktreeInfo } from "../core/git.ts";

type HookName = keyof NonNullable<GwPlugin["hooks"]>;

export class HookRegistry {
  private plugins: GwPlugin[] = [];

  register(plugin: GwPlugin): void {
    this.plugins.push(plugin);
  }

  async emit<K extends HookName>(
    hookName: K,
    ctx: GwContext,
    ...args: Parameters<
      NonNullable<NonNullable<GwPlugin["hooks"]>[K]>
    > extends [GwContext, ...infer Rest]
      ? Rest
      : never[]
  ): Promise<void> {
    for (const plugin of this.plugins) {
      const hook = plugin.hooks?.[hookName];
      if (hook) {
        await (hook as Function)(ctx, ...args);
      }
    }
  }

  getCommands(): GwPlugin["commands"] {
    return this.plugins.flatMap((p) => p.commands ?? []);
  }
}
