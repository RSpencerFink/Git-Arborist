import { c } from '../utils/color.ts';
import { VERSION } from '../version.ts';

export function printVersion(): void {
  console.log(`gw ${VERSION}`);
}

export function printHelp(): void {
  console.log(`
${c.bold('gw')} — Git Worktrees, Finally Simple ${c.dim(`v${VERSION}`)}

${c.bold('LIFECYCLE')}
  ${c.command('gw add <branch>')}          Create worktree for existing branch
  ${c.command('gw add -b <name>')}         Create new branch + worktree
  ${c.command('gw rm [name]')}             Remove worktree (interactive if no name)
  ${c.command('gw go [name]')}             Switch to worktree (interactive if no name)
  ${c.command('gw ls')}                    List all worktrees with status
  ${c.command('gw main')}                  Switch back to main worktree

${c.bold('STATUS & CLEANUP')}
  ${c.command('gw status')}                Status table (branch, dirty, ahead/behind)
  ${c.command('gw dash')}                  Live TUI dashboard (--pr, --graphite)
  ${c.command('gw prune')}                 Remove worktrees for merged branches
  ${c.command('gw gc')}                    Full garbage collection
  ${c.command('gw clean <name>')}          Reset worktree to clean state

${c.bold('PROJECT SETUP')}
  ${c.command('gw init')}                  Scaffold .gw.toml for current repo
  ${c.command('gw setup <name>')}          Re-run setup hooks on existing worktree
  ${c.command('gw clone <repo>')}          Clone repository (--bare for worktree layout)

${c.bold('UTILITIES')}
  ${c.command('gw run <name> -- <cmd>')}   Execute command in a worktree
  ${c.command('gw open <name>')}           Open worktree in editor
  ${c.command('gw tmux <name>')}           Open worktree in tmux window
  ${c.command('gw config <sub>')}          Manage configuration (list|get|set|edit)
  ${c.command('gw plugin <sub>')}          Manage plugins (list|add|remove)
  ${c.command('gw completions <shell>')}   Generate shell completions
  ${c.command('gw shell-init <shell>')}    Print shell integration snippet

${c.bold('OPTIONS')}
  ${c.dim('--help, -h')}                 Show this help message
  ${c.dim('--version, -v')}              Show version number

${c.dim('Shell integration:')}
  ${c.dim('  eval "$(gw shell-init zsh)"    # Add to .zshrc')}
  ${c.dim('  eval "$(gw shell-init bash)"   # Add to .bashrc')}
`);
}

export function printCommandHelp(command: string): void {
  const help = COMMAND_HELP[command];
  if (help) {
    console.log(help);
  } else {
    console.log(`No help available for: ${command}`);
  }
}

const COMMAND_HELP: Record<string, string> = {
  add: `
${c.bold('gw add')} — Create a worktree

${c.bold('Usage:')}
  gw add <branch>              Existing branch
  gw add -b <name>             New branch
  gw add -b <name> --base ref  New branch from ref
`,
  rm: `
${c.bold('gw rm')} — Remove a worktree

${c.bold('Usage:')}
  gw rm [name]                 Interactive if no name
  gw rm <name> --force         Force removal
  gw rm <name> --branch        Also delete the branch
`,
  go: `
${c.bold('gw go')} — Switch to a worktree

${c.bold('Usage:')}
  gw go [name]                 Interactive if no name

${c.dim('Requires shell integration: eval "$(gw shell-init zsh)"')}
`,
};
