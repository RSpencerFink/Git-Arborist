import { existsSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import type { GwPlugin } from "../types.ts";
import { detectPackageManager } from "../../utils/detect.ts";
import { exec } from "../../utils/exec.ts";
import { log } from "../../utils/logger.ts";

const depsPlugin: GwPlugin = {
  name: "deps",
  version: "1.0.0",
  hooks: {
    async "worktree:created"(ctx, wt) {
      const strategy =
        (ctx.config.plugins.deps as { strategy?: string } | undefined)
          ?.strategy ?? "symlink";
      const pm = detectPackageManager(ctx.gitRoot);
      const nodeModulesSource = join(ctx.gitRoot, "node_modules");
      const nodeModulesTarget = join(wt.path, "node_modules");

      if (!existsSync(nodeModulesSource)) return;

      switch (strategy) {
        case "symlink": {
          if (!existsSync(nodeModulesTarget)) {
            symlinkSync(nodeModulesSource, nodeModulesTarget);
            log.success(`  Symlinked node_modules`);
          }
          break;
        }
        case "install": {
          const installCmd =
            pm === "bun"
              ? "bun install --frozen-lockfile"
              : pm === "pnpm"
                ? "pnpm install --frozen-lockfile"
                : pm === "yarn"
                  ? "yarn install --frozen-lockfile"
                  : "npm ci";

          log.info(`  Installing deps with ${pm}...`);
          await exec(["sh", "-c", installCmd], { cwd: wt.path });
          log.success(`  Dependencies installed`);
          break;
        }
        case "copy": {
          log.info(`  Copying node_modules...`);
          await exec(["cp", "-r", nodeModulesSource, nodeModulesTarget]);
          log.success(`  Copied node_modules`);
          break;
        }
      }
    },
  },
};

export default depsPlugin;
