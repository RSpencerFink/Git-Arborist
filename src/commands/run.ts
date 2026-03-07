import type { GwContext } from "../core/context.ts";
import { getWorktrees, findWorktree } from "../core/worktree.ts";
import { exec } from "../utils/exec.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

export async function run(ctx: GwContext, args: string[]): Promise<void> {
  const dashDash = args.indexOf("--");
  let name: string;
  let cmd: string[];

  if (dashDash !== -1) {
    name = args.slice(0, dashDash).join(" ").trim();
    cmd = args.slice(dashDash + 1);
  } else if (args.length >= 2) {
    name = args[0];
    cmd = args.slice(1);
  } else {
    throw new Error("Usage: gw run <name> -- <command>");
  }

  if (!name || cmd.length === 0) {
    throw new Error("Usage: gw run <name> -- <command>");
  }

  const worktrees = await getWorktrees(ctx);
  const wt = findWorktree(worktrees, name);

  if (!wt) {
    throw new Error(`Worktree not found: ${name}`);
  }

  log.dim(`Running in ${c.branch(wt.branch)}: ${cmd.join(" ")}`);

  const result = await exec(cmd, { cwd: wt.path });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  process.exit(result.exitCode);
}
