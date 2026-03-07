import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GwContext } from "../core/context.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";

const DEFAULT_GW_TOML = `# gw configuration
# See: https://github.com/gw-cli/gw

# Where to create worktrees (relative to repo root)
# Available variables: {{ branch }}, {{ branch | sanitize }}
worktree_path = "../.worktrees/{{ branch | sanitize }}"

# Setup hooks — run after worktree creation
# [[setup.copy]]
# from = ".env.local"

# [[setup.symlink]]
# from = "node_modules"

# [[setup.run]]
# command = "bun install --frozen-lockfile"
# if_exists = "bun.lock"

# Plugin configuration
# [plugins.deps]
# enabled = true
# strategy = "symlink"

# [plugins.tmux]
# enabled = true
`;

export async function init(ctx: GwContext, _args: string[]): Promise<void> {
  const configPath = join(ctx.gitRoot, ".gw.toml");

  if (existsSync(configPath)) {
    log.warn(`${c.path(".gw.toml")} already exists in this repository.`);
    return;
  }

  await Bun.write(configPath, DEFAULT_GW_TOML);
  log.success(`Created ${c.path(".gw.toml")} in repository root`);
  log.dim(`  Edit to customize worktree paths, setup hooks, and plugins.`);
}
