export function generateCompletions(shell: string): string {
  switch (shell) {
    case 'zsh':
      return ZSH_COMPLETIONS;
    case 'bash':
      return BASH_COMPLETIONS;
    case 'fish':
      return FISH_COMPLETIONS;
    default:
      throw new Error(`Unsupported shell: ${shell}. Supported: zsh, bash, fish`);
  }
}

const COMMANDS = [
  'add',
  'rm',
  'go',
  'ls',
  'main',
  'status',
  'prune',
  'gc',
  'clean',
  'init',
  'setup',
  'clone',
  'run',
  'open',
  'tmux',
  'config',
  'plugin',
  'completions',
  'shell-init',
];

const ZSH_COMPLETIONS = `#compdef gw

_gw() {
  local -a commands
  commands=(
    'add:Create worktree'
    'rm:Remove worktree'
    'go:Switch to worktree'
    'ls:List worktrees'
    'main:Switch to main worktree'
    'status:Show worktree status table'
    'prune:Remove merged worktrees'
    'gc:Garbage collection'
    'clean:Reset worktree to clean state'
    'init:Scaffold .gw.toml'
    'setup:Run setup hooks'
    'clone:Clone repository'
    'run:Execute command in worktree'
    'open:Open worktree in editor'
    'tmux:Open worktree in tmux'
    'config:Manage configuration'
    'plugin:Manage plugins'
    'completions:Generate completions'
    'shell-init:Print shell integration'
  )

  _arguments -C \\
    '1:command:->command' \\
    '*::arg:->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
    args)
      case $words[1] in
        add)
          _arguments \\
            '-b[Create new branch]' \\
            '--base[Base ref for new branch]:ref:' \\
            '*:branch:_git_branch_names'
          ;;
        rm|go|clean|setup|open|tmux|run)
          # TODO: complete from gw ls output
          ;;
        config)
          _values 'subcommand' list get set edit
          ;;
        plugin)
          _values 'subcommand' list add remove
          ;;
        completions|shell-init)
          _values 'shell' zsh bash fish
          ;;
      esac
      ;;
  esac
}

compdef _gw gw
`;

const BASH_COMPLETIONS = `_gw() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="${COMMANDS.join(' ')}"

  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
    return 0
  fi

  case "\${COMP_WORDS[1]}" in
    config)
      COMPREPLY=( $(compgen -W "list get set edit" -- "$cur") )
      ;;
    plugin)
      COMPREPLY=( $(compgen -W "list add remove" -- "$cur") )
      ;;
    completions|shell-init)
      COMPREPLY=( $(compgen -W "zsh bash fish" -- "$cur") )
      ;;
  esac
}

complete -F _gw gw
`;

const FISH_COMPLETIONS = `# gw fish completions
complete -c gw -f

complete -c gw -n '__fish_use_subcommand' -a add -d 'Create worktree'
complete -c gw -n '__fish_use_subcommand' -a rm -d 'Remove worktree'
complete -c gw -n '__fish_use_subcommand' -a go -d 'Switch to worktree'
complete -c gw -n '__fish_use_subcommand' -a ls -d 'List worktrees'
complete -c gw -n '__fish_use_subcommand' -a main -d 'Switch to main worktree'
complete -c gw -n '__fish_use_subcommand' -a status -d 'Show status table'
complete -c gw -n '__fish_use_subcommand' -a prune -d 'Remove merged worktrees'
complete -c gw -n '__fish_use_subcommand' -a gc -d 'Garbage collection'
complete -c gw -n '__fish_use_subcommand' -a clean -d 'Reset worktree'
complete -c gw -n '__fish_use_subcommand' -a init -d 'Scaffold .gw.toml'
complete -c gw -n '__fish_use_subcommand' -a setup -d 'Run setup hooks'
complete -c gw -n '__fish_use_subcommand' -a clone -d 'Clone repository'
complete -c gw -n '__fish_use_subcommand' -a run -d 'Run command in worktree'
complete -c gw -n '__fish_use_subcommand' -a open -d 'Open in editor'
complete -c gw -n '__fish_use_subcommand' -a tmux -d 'Open in tmux'
complete -c gw -n '__fish_use_subcommand' -a config -d 'Manage config'
complete -c gw -n '__fish_use_subcommand' -a plugin -d 'Manage plugins'
complete -c gw -n '__fish_use_subcommand' -a completions -d 'Generate completions'
complete -c gw -n '__fish_use_subcommand' -a shell-init -d 'Shell integration'

complete -c gw -n '__fish_seen_subcommand_from config' -a 'list get set edit'
complete -c gw -n '__fish_seen_subcommand_from plugin' -a 'list add remove'
complete -c gw -n '__fish_seen_subcommand_from completions shell-init' -a 'zsh bash fish'
`;
