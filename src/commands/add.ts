import { branchExists } from "../core/branch.ts";
import type { GwContext } from "../core/context.ts";
import { createWorktree } from "../core/worktree.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

interface AddArgs {
  branch: string;
  createBranch: boolean;
  base?: string;
}

export function parseAddArgs(args: string[]): AddArgs {
  let branch = "";
  let createBranch = false;
  let base: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-b" || arg === "--new-branch") {
      createBranch = true;
      if (i + 1 < args.length) {
        branch = args[++i];
      }
    } else if (arg === "--base") {
      if (i + 1 < args.length) {
        base = args[++i];
      }
    } else if (!branch) {
      branch = arg;
    }
  }

  if (!branch) {
    throw new Error(
      "Branch name required. Usage: gw add <branch> or gw add -b <new-branch>",
    );
  }

  return { branch, createBranch, base };
}

interface AddJsonResult {
  path: string;
  branch: string;
  head: string;
}

export async function addJson(
  ctx: GwContext,
  args: string[],
): Promise<AddJsonResult> {
  const { branch, createBranch, base } = parseAddArgs(args);

  if (!createBranch) {
    const exists = await branchExists(branch, ctx.gitRoot);
    if (!exists) {
      throw new Error(`Branch '${branch}' does not exist.`);
    }
  }

  const wt = await createWorktree(ctx, branch, { createBranch, base });
  return { path: wt.path, branch: wt.branch, head: wt.head };
}

export async function add(ctx: GwContext, args: string[]): Promise<void> {
  const { branch, createBranch, base } = parseAddArgs(args);

  if (!createBranch) {
    const exists = await branchExists(branch, ctx.gitRoot);
    if (!exists) {
      throw new Error(
        `Branch '${branch}' does not exist. Use ${c.command(`gw add -b ${branch}`)} to create it.`,
      );
    }
  }

  log.info(`Creating worktree for ${c.branch(branch)}...`);

  const wt = await createWorktree(ctx, branch, { createBranch, base });

  log.success(`Worktree created at ${c.path(wt.path)}`);
  log.dim(`  Branch: ${branch}`);
  log.dim(`  Switch: ${c.command(`gw go ${branch}`)}`);
}
