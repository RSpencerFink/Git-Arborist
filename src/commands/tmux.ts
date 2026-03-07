import type { GwContext } from "../core/context.ts";
import { getWorktrees, findWorktree } from "../core/worktree.ts";
import { exec } from "../utils/exec.ts";
import { isInsideTmux } from "../utils/detect.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

export async function tmux(ctx: GwContext, args: string[]): Promise<void> {
  const name = args[0];

  if (!name) {
    throw new Error("Worktree name required. Usage: gw tmux <name>");
  }

  const worktrees = await getWorktrees(ctx);
  const wt = findWorktree(worktrees, name);

  if (!wt) {
    throw new Error(`Worktree not found: ${name}`);
  }

  const windowName = wt.branch.replace(/\//g, "-");

  if (isInsideTmux()) {
    await exec(["tmux", "new-window", "-n", windowName, "-c", wt.path]);
    log.success(`Opened tmux window: ${c.branch(windowName)}`);
  } else {
    // Create or attach to a session
    const sessionName = `gw-${windowName}`;
    await exec(["tmux", "new-session", "-d", "-s", sessionName, "-c", wt.path]);
    log.success(`Created tmux session: ${c.branch(sessionName)}`);
    log.dim(`  Attach with: tmux attach -t ${sessionName}`);
  }
}
