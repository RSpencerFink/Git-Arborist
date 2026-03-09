import type {
  WorktreeItem,
  WhichResult,
  PluginItem,
  PruneResult,
} from "../../src/cli/types";

export const mockWorktrees: WorktreeItem[] = [
  {
    path: "/home/user/project",
    branch: "main",
    head: "abc12345",
    isMain: true,
    isDetached: false,
    isCurrent: true,
    status: {
      ahead: 0,
      behind: 0,
      dirty: false,
      untracked: 0,
      staged: 0,
      modified: 0,
    },
  },
  {
    path: "/home/user/.worktrees/feature-auth",
    branch: "feature/auth",
    head: "def67890",
    isMain: false,
    isDetached: false,
    isCurrent: false,
    status: {
      ahead: 2,
      behind: 0,
      dirty: true,
      untracked: 1,
      staged: 3,
      modified: 2,
    },
  },
  {
    path: "/home/user/.worktrees/fix-bug",
    branch: "fix/login-bug",
    head: "ghi11111",
    isMain: false,
    isDetached: false,
    isCurrent: false,
    status: {
      ahead: 0,
      behind: 3,
      dirty: false,
      untracked: 0,
      staged: 0,
      modified: 0,
    },
  },
];

export const mockWhichResult: WhichResult = {
  current: "main",
  worktrees: [
    {
      branch: "main",
      path: "/home/user/project",
      isMain: true,
      isDetached: false,
      isCurrent: true,
    },
    {
      branch: "feature/auth",
      path: "/home/user/.worktrees/feature-auth",
      isMain: false,
      isDetached: false,
      isCurrent: false,
    },
    {
      branch: "fix/login-bug",
      path: "/home/user/.worktrees/fix-bug",
      isMain: false,
      isDetached: false,
      isCurrent: false,
    },
  ],
};

export const mockPlugins: PluginItem[] = [
  { name: "git", enabled: true, builtin: true },
  { name: "deps", enabled: false, builtin: true },
  { name: "env", enabled: false, builtin: true },
  { name: "tmux", enabled: false, builtin: true },
  { name: "github", enabled: true, builtin: true },
  { name: "graphite", enabled: false, builtin: true },
];

export const mockPruneDryRun: PruneResult = {
  candidates: [
    {
      branch: "feature/old",
      path: "/home/user/.worktrees/old",
      reason: "merged into main",
    },
  ],
};

export const mockPruneResult: PruneResult = {
  removed: [
    {
      branch: "feature/old",
      path: "/home/user/.worktrees/old",
      reason: "merged into main",
    },
  ],
  failed: [],
};
