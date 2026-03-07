import type { GwContext } from "../core/context.ts";
import { getWorktrees } from "../core/worktree.ts";
import { c } from "../utils/color.ts";

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
