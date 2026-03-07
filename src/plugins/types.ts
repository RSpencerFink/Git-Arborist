import type { GwContext } from "../core/context.ts";
import type { WorktreeInfo } from "../core/git.ts";

export interface StatusExtension {
  label: string;
  value: string;
}

export interface PluginCommand {
  name: string;
  description: string;
  run(ctx: GwContext, args: string[]): Promise<void>;
}

export interface GwPlugin {
  name: string;
  version: string;
  hooks?: {
    "worktree:created"?: (ctx: GwContext, wt: WorktreeInfo) => Promise<void>;
    "worktree:ready"?: (ctx: GwContext, wt: WorktreeInfo) => Promise<void>;
    "worktree:removing"?: (
      ctx: GwContext,
      wt: WorktreeInfo,
    ) => Promise<boolean | void>;
    "worktree:removed"?: (
      ctx: GwContext,
      info: { name: string; branch: string },
    ) => Promise<void>;
    "worktree:switch"?: (
      ctx: GwContext,
      from: WorktreeInfo | null,
      to: WorktreeInfo,
    ) => Promise<void>;
    "status:extend"?: (
      ctx: GwContext,
      wt: WorktreeInfo,
    ) => Promise<StatusExtension[]>;
    "prune:shouldRemove"?: (
      ctx: GwContext,
      wt: WorktreeInfo,
    ) => Promise<boolean | null>;
  };
  commands?: PluginCommand[];
  activate?(ctx: GwContext): Promise<void>;
  deactivate?(): Promise<void>;
}
