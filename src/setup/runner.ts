import { existsSync, symlinkSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import type { GwContext } from "../core/context.ts";
import { exec } from "../utils/exec.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

export async function runSetupHooks(
  ctx: GwContext,
  worktreePath: string,
  mainWorktreePath?: string,
): Promise<void> {
  const { setup } = ctx.config;
  const sourcePath = mainWorktreePath ?? ctx.gitRoot;

  // Copy files
  if (setup.copy) {
    for (const item of setup.copy) {
      const copyItem = item as { from: string; to?: string };
      const from = join(sourcePath, copyItem.from);
      const to = join(worktreePath, copyItem.to ?? copyItem.from);

      if (!existsSync(from)) {
        log.dim(`  Skip copy (not found): ${copyItem.from}`);
        continue;
      }

      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
      log.success(`  Copied ${c.dim(copyItem.from)}`);
    }
  }

  // Create symlinks
  if (setup.symlink) {
    for (const item of setup.symlink) {
      const symlinkItem = item as { from: string; to?: string };
      const from = join(sourcePath, symlinkItem.from);
      const to = join(worktreePath, symlinkItem.to ?? symlinkItem.from);

      if (!existsSync(from)) {
        log.dim(`  Skip symlink (not found): ${symlinkItem.from}`);
        continue;
      }

      if (existsSync(to)) {
        log.dim(`  Skip symlink (exists): ${symlinkItem.from}`);
        continue;
      }

      mkdirSync(dirname(to), { recursive: true });
      symlinkSync(from, to);
      log.success(`  Symlinked ${c.dim(symlinkItem.from)}`);
    }
  }

  // Run commands
  if (setup.run) {
    for (const item of setup.run) {
      const runItem = item as { command: string; if_exists?: string };

      if (
        runItem.if_exists &&
        !existsSync(join(worktreePath, runItem.if_exists))
      ) {
        log.dim(`  Skip run (condition not met): ${runItem.command}`);
        continue;
      }

      log.info(`  Running: ${c.dim(runItem.command)}`);
      const result = await exec(["sh", "-c", runItem.command], {
        cwd: worktreePath,
      });

      if (result.exitCode !== 0) {
        log.warn(
          `  Command failed (exit ${result.exitCode}): ${runItem.command}`,
        );
        if (result.stderr) log.dim(`  ${result.stderr}`);
      } else {
        log.success(`  Completed: ${c.dim(runItem.command)}`);
      }
    }
  }
}
