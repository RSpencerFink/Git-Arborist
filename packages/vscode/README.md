# Git Arborist for VS Code

Manage git worktrees directly from VS Code. Requires the [git-arborist](https://github.com/rspencerfink/git-arborist) CLI (`arb`).

## Features

- **Worktree sidebar** — view all worktrees in the activity bar with branch, status, and sync info
- **Create worktrees** — create from existing or new branches with a single command
- **Switch worktrees** — open a worktree in a new window or replace the current one
- **Remove worktrees** — delete worktrees with optional branch cleanup
- **Prune merged** — bulk-remove worktrees whose branches have been merged
- **Live dashboard** — webview panel with auto-refreshing worktree status
- **Run commands** — execute commands inside any worktree's directory
- **Setup hooks** — re-run setup hooks (dependency install, env file copy, etc.)
- **Plugin status** — view enabled plugins (GitHub PR status, Graphite stacks, etc.)
- **Status bar** — shows current worktree branch at a glance

## Commands

All commands are available via the Command Palette (`Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| Git Arborist: Add Worktree | Create a new worktree |
| Git Arborist: Remove Worktree | Remove a worktree |
| Git Arborist: Switch Worktree | Switch to a worktree |
| Git Arborist: Switch to Main Worktree | Go back to main |
| Git Arborist: Prune Merged Worktrees | Remove merged worktrees |
| Git Arborist: Clean Worktree | Discard all changes in a worktree |
| Git Arborist: Open Dashboard | Open the live dashboard panel |
| Git Arborist: Run Command in Worktree | Run a command in a worktree |
| Git Arborist: Clone Repository | Clone a repo (standard or bare layout) |
| Git Arborist: Initialize Config | Scaffold `.arborist.toml` |
| Git Arborist: Edit Config | Open project or global config |
| Git Arborist: Garbage Collect | Run git garbage collection |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `arborist.binaryPath` | auto-detect | Path to `arb` binary |
| `arborist.switchBehavior` | `newWindow` | Open worktree in new window or replace current |
| `arborist.autoRefreshInterval` | `10000` | Tree view refresh interval (ms) |
| `arborist.showStatusBar` | `true` | Show current branch in status bar |
| `arborist.dashboardRefreshInterval` | `5000` | Dashboard refresh interval (ms) |

## Requirements

Install the `arb` CLI before using this extension:

```bash
brew install rspencerfink/git-arborist/arb
# or
bun add -g git-arborist
```

## License

MIT
