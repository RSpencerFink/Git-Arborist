import type { ArboristContext } from '../core/context.ts';
import type { WorktreeInfo } from '../core/git.ts';

export interface StatusExtension {
  label: string;
  value: string;
}

export interface PluginCommand {
  name: string;
  description: string;
  run(ctx: ArboristContext, args: string[]): Promise<void>;
}

export interface ArboristPlugin {
  name: string;
  version: string;
  hooks?: {
    'worktree:created'?: (ctx: ArboristContext, wt: WorktreeInfo) => Promise<void>;
    'worktree:ready'?: (ctx: ArboristContext, wt: WorktreeInfo) => Promise<void>;
    'worktree:removing'?: (ctx: ArboristContext, wt: WorktreeInfo) => Promise<boolean | undefined>;
    'worktree:removed'?: (
      ctx: ArboristContext,
      info: { name: string; branch: string },
    ) => Promise<void>;
    'worktree:switch'?: (
      ctx: ArboristContext,
      from: WorktreeInfo | null,
      to: WorktreeInfo,
    ) => Promise<void>;
    'status:extend'?: (ctx: ArboristContext, wt: WorktreeInfo) => Promise<StatusExtension[]>;
    'prune:shouldRemove'?: (ctx: ArboristContext, wt: WorktreeInfo) => Promise<boolean | null>;
  };
  commands?: PluginCommand[];
  activate?(ctx: ArboristContext): Promise<void>;
  deactivate?(): Promise<void>;
}
