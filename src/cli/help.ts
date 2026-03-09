import { c } from '../utils/color.ts';
import { VERSION } from '../version.ts';

export function printVersion(): void {
  console.log(`arb ${VERSION}`);
}

export function printHelp(): void {
  console.log(`
${c.bold('arb')} — Git Worktrees, Finally Simple ${c.dim(`v${VERSION}`)}

${c.bold('LIFECYCLE')}
  ${c.command('arb add <branch>')}          Create worktree for existing branch
  ${c.command('arb add -b <name>')}         Create new branch + worktree
  ${c.command('arb rm [name]')}             Remove worktree (interactive if no name)
  ${c.command('arb go [name]')}             Switch to worktree (interactive if no name)
  ${c.command('arb ls')}                    List all worktrees with status
  ${c.command('arb main')}                  Switch back to main worktree

${c.bold('STATUS & CLEANUP')}
  ${c.command('arb status')}                Status table (branch, dirty, ahead/behind)
  ${c.command('arb dash')}                  Live TUI dashboard (--pr, --graphite)
  ${c.command('arb prune')}                 Remove worktrees for merged branches
  ${c.command('arb gc')}                    Full garbage collection
  ${c.command('arb clean <name>')}          Reset worktree to clean state

${c.bold('PROJECT SETUP')}
  ${c.command('arb init')}                  Scaffold .arborist.toml for current repo
  ${c.command('arb setup <name>')}          Re-run setup hooks on existing worktree
  ${c.command('arb clone <repo>')}          Clone repository (--bare for worktree layout)

${c.bold('UTILITIES')}
  ${c.command('arb which')}                 Show current worktree branch
  ${c.command('arb run <name> -- <cmd>')}   Execute command in a worktree
  ${c.command('arb open <name>')}           Open worktree in editor
  ${c.command('arb tmux <name>')}           Open worktree in tmux window
  ${c.command('arb config <sub>')}          Manage configuration (list|get|set|edit)
  ${c.command('arb plugin <sub>')}          Manage plugins (list|add|remove)
  ${c.command('arb completions <shell>')}   Generate shell completions
  ${c.command('arb shell-init <shell>')}    Print shell integration snippet
  ${c.command('arb shell-setup')}           Auto-configure shell integration

${c.bold('OPTIONS')}
  ${c.dim('--help, -h')}                 Show this help message
  ${c.dim('--version, -v')}              Show version number
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
${c.bold('arb add')} — Create a worktree

${c.bold('Usage:')}
  arb add <branch>              Existing branch
  arb add -b <name>             New branch
  arb add -b <name> --base ref  New branch from ref
`,
  rm: `
${c.bold('arb rm')} — Remove a worktree

${c.bold('Usage:')}
  arb rm [name]                 Interactive if no name
  arb rm <name> --force         Force removal
  arb rm <name> --branch        Also delete the branch
`,
  go: `
${c.bold('arb go')} — Switch to a worktree

${c.bold('Usage:')}
  arb go [name]                 Interactive if no name

${c.dim('Requires shell integration: eval "$(arb shell-init zsh)"')}
`,
};
