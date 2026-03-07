# gw — Git Worktrees, Finally Simple

A fast, opinionated CLI for managing git worktrees. Two characters, zero friction.

`gw` wraps git's worktree commands with smart defaults, automated project setup, a plugin system for GitHub/Graphite integrations, and a live TUI dashboard.

Built with TypeScript + Bun. Ships as a single binary.

## Install

### Homebrew (macOS / Linux)

```bash
brew install gw-cli/gw/gw
```

### curl one-liner

```bash
curl -fsSL https://raw.githubusercontent.com/gw-cli/gw/main/install.sh | bash
```

### npm / bun

```bash
bun add -g gwx       # requires Bun runtime
# or
npm i -g gwx         # also requires Bun installed
```

### GitHub Releases

Download the binary for your platform from [Releases](https://github.com/gw-cli/gw/releases), then:

```bash
chmod +x gw-darwin-arm64     # or your platform
mv gw-darwin-arm64 /usr/local/bin/gw
```

### From source (requires [Bun](https://bun.sh))

```bash
git clone https://github.com/gw-cli/gw.git
cd gw
bun install
bun run build    # produces ./gw binary
mv gw /usr/local/bin/
```

### Shell integration

`gw go` and `gw main` need to change your shell's directory. Add this to your shell config:

```bash
# zsh (~/.zshrc)
eval "$(gw shell-init zsh)"

# bash (~/.bashrc)
eval "$(gw shell-init bash)"

# fish (~/.config/fish/config.fish)
gw shell-init fish | source
```

### Shell completions

```bash
# zsh
gw completions zsh > ~/.zfunc/_gw

# bash
gw completions bash > /etc/bash_completion.d/gw

# fish
gw completions fish > ~/.config/fish/completions/gw.fish
```

## Quick start

```bash
cd your-repo

# Create a worktree for a new branch
gw add -b my-feature

# Switch to it (requires shell integration)
gw go my-feature

# See all worktrees
gw ls

# Go back to the main worktree
gw main

# Done? Remove it
gw rm my-feature
```

## Commands

### Lifecycle

| Command | Description |
|---------|-------------|
| `gw add <branch>` | Create a worktree for an existing branch |
| `gw add -b <name>` | Create a new branch + worktree |
| `gw add -b <name> --base <ref>` | Create a new branch from a specific ref |
| `gw rm [name]` | Remove a worktree (interactive picker if no name) |
| `gw rm <name> --force` | Force remove even if dirty |
| `gw rm <name> --branch` | Also delete the branch |
| `gw go [name]` | Switch to a worktree (interactive picker if no name) |
| `gw ls` | List all worktrees with status |
| `gw main` | Switch back to the main worktree |

### Status & cleanup

| Command | Description |
|---------|-------------|
| `gw status` | Formatted table with branch, head, dirty status, ahead/behind |
| `gw dash` | Live TUI dashboard with auto-refresh |
| `gw prune` | Remove worktrees whose branches are merged |
| `gw prune --dry-run` | Preview what would be pruned |
| `gw gc` | Prune stale refs + run git garbage collection |
| `gw clean <name>` | Reset a worktree to a clean state |

### Project setup

| Command | Description |
|---------|-------------|
| `gw init` | Scaffold a `.gw.toml` config file in your repo |
| `gw setup <name>` | Re-run setup hooks on an existing worktree |
| `gw clone <repo>` | Clone a repository |
| `gw clone <repo> --bare` | Clone in bare-worktree layout (`.bare/` + worktrees as siblings) |

### Utilities

| Command | Description |
|---------|-------------|
| `gw run <name> -- <cmd>` | Run a command inside a worktree's directory |
| `gw open <name>` | Open a worktree in your editor |
| `gw tmux <name>` | Open a worktree in a new tmux window |
| `gw config list` | Show current configuration |
| `gw config get <key>` | Get a config value |
| `gw config edit` | Open project config in `$EDITOR` |
| `gw config edit --global` | Open global config in `$EDITOR` |
| `gw plugin list` | List available plugins and their status |

## Configuration

`gw` uses TOML configuration with two levels:

- **Project**: `.gw.toml` in your repo root (commit this)
- **Global**: `~/.config/gw/config.toml`

Project config takes precedence over global config.

### Example `.gw.toml`

```toml
# Where worktrees are created (relative to repo root)
# Available variables: {{ branch }}, with filters: {{ branch | sanitize }}
worktree_path = "../.worktrees/{{ branch | sanitize }}"

# Editor for `gw open`
editor = "code"

# Copy files from main worktree after creation
[[setup.copy]]
from = ".env.local"

# Symlink directories from main worktree
[[setup.symlink]]
from = "node_modules"

# Run commands after creation (conditional on file existence)
[[setup.run]]
command = "bun install --frozen-lockfile"
if_exists = "bun.lock"

[[setup.run]]
command = "cp .env.example .env"
if_exists = ".env.example"

# Enable plugins
[plugins.deps]
enabled = true
strategy = "symlink"   # "symlink" | "install" | "copy"

[plugins.env]
enabled = true

[plugins.tmux]
enabled = true

[plugins.github]
enabled = true

[plugins.graphite]
enabled = true
```

### Template variables

The `worktree_path` setting supports template variables:

| Variable | Example input | Output |
|----------|--------------|--------|
| `{{ branch }}` | `feature/auth` | `feature/auth` |
| `{{ branch \| sanitize }}` | `feature/auth@v2!` | `feature/auth-v2` |
| `{{ branch \| lowercase }}` | `Feature/Auth` | `feature/auth` |
| `{{ branch \| uppercase }}` | `feature/auth` | `FEATURE/AUTH` |

## Plugins

Plugins hook into worktree lifecycle events and can extend the command tree.

### Built-in plugins

#### `deps` — Dependency management

Automatically handles `node_modules` when creating worktrees.

```toml
[plugins.deps]
enabled = true
strategy = "symlink"   # fast, disk-efficient (default)
# strategy = "install" # fresh install via detected package manager
# strategy = "copy"    # full copy of node_modules
```

Detects your package manager automatically (bun, pnpm, yarn, npm).

#### `env` — Environment files

Copies `.env*` files from the main worktree to new worktrees (skips `.env.example`).

```toml
[plugins.env]
enabled = true
```

#### `tmux` — Tmux integration

Automatically opens new worktrees in a tmux window (only when running inside tmux).

```toml
[plugins.tmux]
enabled = true
```

#### `github` — GitHub PR status

Shows PR status and CI checks in `gw ls`, `gw dash`, and on worktree creation. Requires the [GitHub CLI](https://cli.github.com/) (`gh`).

```toml
[plugins.github]
enabled = true
```

Adds the `gw pr` command to show PR status for all worktrees.

#### `graphite` — Stack awareness

Shows Graphite stack position and restack warnings. Requires the [Graphite CLI](https://graphite.dev/) (`gt`).

```toml
[plugins.graphite]
enabled = true
```

Adds commands:
- `gw stack` — Show the current Graphite stack
- `gw submit` — Submit the current stack

## TUI Dashboard

`gw dash` launches a live, interactive dashboard:

```
 gw dashboard │ 3 worktrees │ refreshed 2:15:30 PM

     Branch                      Head      Status          Sync        Path
 ──────────────────────────────────────────────────────────────────────────────
 * main                          a1b2c3d   ✓ clean         —           /repo
   feature/auth                  d4e5f6a   ~2 ?1           ↑1          /worktrees/feature-auth
   bugfix/login                  g7h8i9j   +1              ↓2          /worktrees/bugfix-login

 [j/k] navigate  [r] refresh  [q] quit
```

Flags:
- `--pr` — Show GitHub PR column (or enable the `github` plugin)
- `--graphite` — Show Graphite stack column (or enable the `graphite` plugin)

Auto-refreshes every 5 seconds.

## Worktree path layout

By default, worktrees are created as siblings to your repo:

```
projects/
├── my-repo/              # main worktree
├── .worktrees/
│   ├── feature-auth/     # gw add -b feature/auth
│   └── bugfix-login/     # gw add -b bugfix/login
```

With `gw clone --bare`, you get a flat layout:

```
projects/
├── my-repo/
│   ├── .bare/            # git object store
│   ├── .git              # gitdir pointer to .bare
│   └── main/             # main worktree
```

## Plugin API

Create custom plugins as `.ts` files in `.gw/plugins/` or as npm packages named `gw-plugin-*`.

```typescript
import type { GwPlugin } from 'gw/plugins/types';

const myPlugin: GwPlugin = {
  name: 'my-plugin',
  version: '1.0.0',

  hooks: {
    async 'worktree:created'(ctx, wt) {
      // Runs after a worktree is created
    },
    async 'worktree:removing'(ctx, wt) {
      // Return false to prevent removal
    },
    async 'status:extend'(ctx, wt) {
      // Add custom columns to gw ls / gw dash
      return [{ label: 'Deploy', value: 'staging' }];
    },
  },

  commands: [
    {
      name: 'my-command',
      description: 'Does something custom',
      async run(ctx, args) {
        // Available as `gw my-command`
      },
    },
  ],
};

export default myPlugin;
```

### Available hooks

| Hook | When | Arguments |
|------|------|-----------|
| `worktree:created` | After worktree creation | `(ctx, worktreeInfo)` |
| `worktree:ready` | After creation + setup complete | `(ctx, worktreeInfo)` |
| `worktree:removing` | Before removal (return `false` to cancel) | `(ctx, worktreeInfo)` |
| `worktree:removed` | After removal | `(ctx, { name, branch })` |
| `worktree:switch` | When switching worktrees | `(ctx, from, to)` |
| `status:extend` | During status display | `(ctx, worktreeInfo)` → `StatusExtension[]` |
| `prune:shouldRemove` | During prune evaluation | `(ctx, worktreeInfo)` → `boolean \| null` |

## Development

```bash
bun install
bun run dev -- ls           # run commands during development
bun test                    # run test suite
bun run lint                # lint with biome
bun run build               # compile to standalone binary
```

## License

MIT
