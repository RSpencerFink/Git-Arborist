import { describe, expect, test } from "bun:test";
import { findWorktree } from "../../src/core/worktree.ts";
import type { WorktreeInfo } from "../../src/core/git.ts";

const mockWorktrees: WorktreeInfo[] = [
  {
    path: "/repo",
    branch: "main",
    head: "abc123",
    isBare: false,
    isMain: true,
    isDetached: false,
  },
  {
    path: "/wt/feature-auth",
    branch: "feature/auth",
    head: "def456",
    isBare: false,
    isMain: false,
    isDetached: false,
  },
  {
    path: "/wt/bugfix-login",
    branch: "bugfix/login",
    head: "ghi789",
    isBare: false,
    isMain: false,
    isDetached: false,
  },
];

describe("findWorktree", () => {
  test("finds by exact branch name", () => {
    const wt = findWorktree(mockWorktrees, "feature/auth");
    expect(wt?.branch).toBe("feature/auth");
  });

  test("finds by directory name", () => {
    const wt = findWorktree(mockWorktrees, "feature-auth");
    expect(wt?.branch).toBe("feature/auth");
  });

  test("finds by branch suffix", () => {
    const wt = findWorktree(mockWorktrees, "auth");
    expect(wt?.branch).toBe("feature/auth");
  });

  test("finds by partial match", () => {
    const wt = findWorktree(mockWorktrees, "login");
    expect(wt?.branch).toBe("bugfix/login");
  });

  test("returns undefined for no match", () => {
    const wt = findWorktree(mockWorktrees, "nonexistent");
    expect(wt).toBeUndefined();
  });
});
