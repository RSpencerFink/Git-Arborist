import type { GwPlugin } from "../types.ts";
import { exec } from "../../utils/exec.ts";
import { isInsideTmux } from "../../utils/detect.ts";
import { log } from "../../utils/logger.ts";

const tmuxPlugin: GwPlugin = {
  name: "tmux",
  version: "1.0.0",
  hooks: {
    async "worktree:created"(_ctx, wt) {
      if (!isInsideTmux()) return;

      const windowName = wt.branch.replace(/\//g, "-");
      await exec(["tmux", "new-window", "-n", windowName, "-c", wt.path]);
      log.success(`  Opened tmux window: ${windowName}`);
    },
  },
};

export default tmuxPlugin;
