import { basename, resolve } from "node:path";
import type { GwContext } from "../core/context.ts";
import { execOrThrow } from "../utils/exec.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

export async function clone(
  _ctx: GwContext | null,
  args: string[],
): Promise<void> {
  const bare = args.includes("--bare");
  const repo = args.find((a) => !a.startsWith("-"));

  if (!repo) {
    throw new Error("Repository URL required. Usage: gw clone <repo> [--bare]");
  }

  // Derive directory name from repo URL
  const repoName = basename(repo).replace(/\.git$/, "");

  if (bare) {
    // Bare clone layout: repoName/.bare + repoName/main
    const targetDir = resolve(process.cwd(), repoName);
    const bareDir = resolve(targetDir, ".bare");

    log.info(`Cloning ${c.cyan(repo)} as bare repo...`);

    await execOrThrow(["git", "clone", "--bare", repo, bareDir]);

    // Set up gitdir file pointing to .bare
    await Bun.write(resolve(targetDir, ".git"), `gitdir: ./.bare\n`);

    // Add main worktree
    await execOrThrow(["git", "worktree", "add", "main"], { cwd: targetDir });

    log.success(`Cloned to ${c.path(targetDir)} (bare layout)`);
    log.dim(`  Main worktree: ${targetDir}/main`);
  } else {
    log.info(`Cloning ${c.cyan(repo)}...`);
    await execOrThrow(["git", "clone", repo, repoName]);
    log.success(`Cloned to ${c.path(resolve(process.cwd(), repoName))}`);
  }
}
