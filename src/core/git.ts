import { exec, execOrThrow } from "../utils/exec.ts";

export interface WorktreeInfo {
  path: string;
  branch: string;
  head: string;
  isBare: boolean;
  isMain: boolean;
  isDetached: boolean;
}

export interface BranchStatus {
  ahead: number;
  behind: number;
  dirty: boolean;
  untracked: number;
  staged: number;
  modified: number;
}

export async function getGitRoot(cwd?: string): Promise<string> {
  // For bare repos, rev-parse --show-toplevel won't work, so try --git-common-dir
  const result = await exec(["git", "rev-parse", "--show-toplevel"], { cwd });
  if (result.exitCode === 0) return result.stdout;

  // Try bare repo detection
  const bareResult = await exec(["git", "rev-parse", "--git-common-dir"], {
    cwd,
  });
  if (bareResult.exitCode === 0) return bareResult.stdout;

  throw new Error("Not inside a git repository");
}

export async function getGitCommonDir(cwd?: string): Promise<string> {
  return execOrThrow(["git", "rev-parse", "--git-common-dir"], { cwd });
}

export async function listWorktrees(cwd?: string): Promise<WorktreeInfo[]> {
  const output = await execOrThrow(["git", "worktree", "list", "--porcelain"], {
    cwd,
  });
  if (!output.trim()) return [];

  const blocks = output.split("\n\n").filter(Boolean);
  const worktrees: WorktreeInfo[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    let path = "";
    let branch = "";
    let head = "";
    let isBare = false;
    let isDetached = false;

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        path = line.slice("worktree ".length);
      } else if (line.startsWith("HEAD ")) {
        head = line.slice("HEAD ".length);
      } else if (line.startsWith("branch ")) {
        branch = line.slice("branch ".length).replace("refs/heads/", "");
      } else if (line === "bare") {
        isBare = true;
      } else if (line === "detached") {
        isDetached = true;
      }
    }

    if (path) {
      worktrees.push({
        path,
        branch,
        head: head.slice(0, 8),
        isBare,
        isMain: worktrees.length === 0,
        isDetached,
      });
    }
  }

  return worktrees;
}

export async function addWorktree(
  path: string,
  branch: string,
  options?: { createBranch?: boolean; base?: string; cwd?: string },
): Promise<void> {
  const args = ["git", "worktree", "add"];

  if (options?.createBranch) {
    args.push("-b", branch);
    args.push(path);
    if (options.base) {
      args.push(options.base);
    }
  } else {
    args.push(path);
    args.push(branch);
  }

  await execOrThrow(args, { cwd: options?.cwd });
}

export async function removeWorktree(
  path: string,
  force?: boolean,
  cwd?: string,
): Promise<void> {
  const args = ["git", "worktree", "remove", path];
  if (force) args.push("--force");
  await execOrThrow(args, { cwd });
}

export async function pruneWorktrees(cwd?: string): Promise<void> {
  await execOrThrow(["git", "worktree", "prune"], { cwd });
}

export async function getDefaultBranch(cwd?: string): Promise<string> {
  // Try symbolic-ref for origin/HEAD first
  const result = await exec(
    ["git", "symbolic-ref", "refs/remotes/origin/HEAD", "--short"],
    { cwd },
  );
  if (result.exitCode === 0) {
    return result.stdout.replace("origin/", "");
  }

  // Fall back to checking for common default branches
  for (const branch of ["main", "master"]) {
    const check = await exec(
      ["git", "rev-parse", "--verify", `refs/heads/${branch}`],
      { cwd },
    );
    if (check.exitCode === 0) return branch;
  }

  return "main";
}

export async function getCurrentBranch(cwd?: string): Promise<string> {
  return execOrThrow(["git", "rev-parse", "--abbrev-ref", "HEAD"], { cwd });
}

export async function getBranchStatus(
  branch: string,
  cwd?: string,
): Promise<BranchStatus> {
  const statusOutput = await exec(["git", "status", "--porcelain", "-b"], {
    cwd,
  });
  const lines = statusOutput.stdout.split("\n").filter(Boolean);

  let ahead = 0;
  let behind = 0;
  let staged = 0;
  let modified = 0;
  let untracked = 0;

  for (const line of lines) {
    if (line.startsWith("##")) {
      const match = line.match(/\[ahead (\d+)(?:, behind (\d+))?\]/);
      if (match) {
        ahead = parseInt(match[1], 10);
        behind = match[2] ? parseInt(match[2], 10) : 0;
      }
      const behindMatch = line.match(/\[behind (\d+)\]/);
      if (behindMatch) {
        behind = parseInt(behindMatch[1], 10);
      }
      continue;
    }

    const x = line[0];
    const y = line[1];

    if (x === "?" && y === "?") {
      untracked++;
    } else {
      if (x !== " " && x !== "?") staged++;
      if (y !== " " && y !== "?") modified++;
    }
  }

  return {
    ahead,
    behind,
    dirty: staged > 0 || modified > 0 || untracked > 0,
    untracked,
    staged,
    modified,
  };
}

export async function deleteBranch(
  branch: string,
  force?: boolean,
  cwd?: string,
): Promise<void> {
  const flag = force ? "-D" : "-d";
  await execOrThrow(["git", "branch", flag, branch], { cwd });
}

export async function branchExists(
  branch: string,
  cwd?: string,
): Promise<boolean> {
  const result = await exec(
    ["git", "rev-parse", "--verify", `refs/heads/${branch}`],
    { cwd },
  );
  return result.exitCode === 0;
}

export async function isMerged(
  branch: string,
  into: string,
  cwd?: string,
): Promise<boolean> {
  const result = await exec(
    ["git", "merge-base", "--is-ancestor", branch, into],
    { cwd },
  );
  return result.exitCode === 0;
}
