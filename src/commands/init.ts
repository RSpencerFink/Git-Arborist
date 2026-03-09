import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ArboristContext } from '../core/context.ts';
import { c } from '../utils/color.ts';
import { log } from '../utils/logger.ts';

const DEFAULT_ARBORIST_TOML = `# arborist configuration
# See: https://github.com/rspencerfink/git-arborist

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

export async function init(ctx: ArboristContext, _args: string[]): Promise<void> {
  const configPath = join(ctx.gitRoot, '.arborist.toml');

  if (existsSync(configPath)) {
    log.warn(`${c.path('.arborist.toml')} already exists in this repository.`);
    return;
  }

  await Bun.write(configPath, DEFAULT_ARBORIST_TOML);
  log.success(`Created ${c.path('.arborist.toml')} in repository root`);
  log.dim('  Edit to customize worktree paths, setup hooks, and plugins.');
}
