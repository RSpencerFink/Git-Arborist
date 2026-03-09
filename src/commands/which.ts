import type { GwContext } from "../core/context.ts";
import { getWorktrees } from "../core/worktree.ts";
import { c } from "../utils/color.ts";

interface WhichJsonItem {
  branch: string;
  path: string;
  isMain: boolean;
  isDetached: boolean;
  isCurrent: boolean;
}

interface WhichJsonResult {
  current: string | null;
  worktrees: WhichJsonItem[];
}

export async function whichJson(
  ctx: GwContext,
  _args: string[],
): Promise<WhichJsonResult> {
  const worktrees = await getWorktrees(ctx);
  const nonBare = worktrees.filter((wt) => !wt.isBare);
  const currentPath = process.cwd();

  let current: string | null = null;
  const items: WhichJsonItem[] = [];

  for (const wt of nonBare) {
    const isCurrent =
      wt.path === currentPath || currentPath.startsWith(`${wt.path}/`);
    if (isCurrent) current = wt.branch || wt.head;
    items.push({
      branch: wt.isDetached ? `(${wt.head})` : wt.branch,
      path: wt.path,
      isMain: wt.isMain,
      isDetached: wt.isDetached,
      isCurrent,
    });
  }

  return { current, worktrees: items };
}

export async function which(ctx: GwContext, _args: string[]): Promise<void> {
  const worktrees = await getWorktrees(ctx);
  const nonBare = worktrees.filter((wt) => !wt.isBare);
  const currentPath = process.cwd();

  console.log(c.bold("Checked-out branches:"));
  console.log();

  for (const wt of nonBare) {
    const isCurrent =
      wt.path === currentPath || currentPath.startsWith(`${wt.path}/`);
    const branch = wt.isDetached ? `(${wt.head})` : wt.branch;
    const marker = isCurrent ? c.green("● ") : "  ";
    const name = isCurrent ? c.green(c.bold(branch)) : branch;
    const meta = wt.isMain ? c.dim(" (main)") : "";
    const path = c.dim(wt.path);

    console.log(`${marker}${name}${meta}  ${path}`);
  }

  console.log();
  console.log(
    c.dim(
      `${nonBare.length} branch${nonBare.length !== 1 ? "es" : ""} checked out — these cannot be used in other worktrees`,
    ),
  );
}
