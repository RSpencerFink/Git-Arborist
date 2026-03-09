export interface BranchStatus {
  ahead: number;
  behind: number;
  dirty: boolean;
  untracked: number;
  staged: number;
  modified: number;
}

export interface WorktreeItem {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isDetached: boolean;
  isCurrent: boolean;
  status: BranchStatus | null;
}

export interface WhichResult {
  current: string | null;
  worktrees: Array<{
    branch: string;
    path: string;
    isMain: boolean;
    isDetached: boolean;
    isCurrent: boolean;
  }>;
}

export interface AddResult {
  path: string;
  branch: string;
  head: string;
}

export interface RmResult {
  branch: string;
  path: string;
  deleted_branch?: string;
  branch_delete_error?: string;
}

export interface PruneCandidate {
  branch: string;
  path: string;
  reason: string;
}

export interface PruneResult {
  candidates?: PruneCandidate[];
  removed?: PruneCandidate[];
  failed?: Array<{ branch: string; path: string; error: string }>;
}

export interface DashWorktree {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isDetached: boolean;
  isCurrent: boolean;
  status: BranchStatus | null;
  pr: { number: number; state: string; url: string; ciStatus?: string } | null;
  graphite: { stack?: string; position?: string } | null;
}

export interface PluginItem {
  name: string;
  enabled: boolean;
  builtin: boolean;
}

export interface GwConfig {
  worktree_path: string;
  editor?: string;
  setup: {
    copy?: Array<{ from: string; to?: string }>;
    symlink?: Array<{ from: string; to?: string }>;
    run?: Array<{ command: string; if_exists?: string }>;
  };
  plugins: Record<string, { enabled: boolean; [key: string]: unknown }>;
}

export interface GwError {
  error: string;
  code: string;
}

export type GwResult<T> = T | GwError;

export function isGwError(value: unknown): value is GwError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "code" in value
  );
}
