import { existsSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { GwPlugin } from "../types.ts";
import { log } from "../../utils/logger.ts";

const envPlugin: GwPlugin = {
  name: "env",
  version: "1.0.0",
  hooks: {
    async "worktree:created"(ctx, wt) {
      // Copy .env* files from main worktree
      const entries = readdirSync(ctx.gitRoot);
      const envFiles = entries.filter(
        (f) => f.startsWith(".env") && !f.endsWith(".example"),
      );

      for (const file of envFiles) {
        const source = join(ctx.gitRoot, file);
        const target = join(wt.path, file);

        if (existsSync(target)) continue;

        copyFileSync(source, target);
        log.success(`  Copied ${file}`);
      }
    },
  },
};

export default envPlugin;
