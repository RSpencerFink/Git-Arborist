export function generateShellInit(shell: string): string {
  switch (shell) {
    case 'zsh':
      return ZSH_INIT;
    case 'bash':
      return BASH_INIT;
    case 'fish':
      return FISH_INIT;
    default:
      throw new Error(`Unsupported shell: ${shell}. Supported: zsh, bash, fish`);
  }
}

const ZSH_INIT = `# arb shell integration for zsh
# Add to .zshrc: eval "$(arb shell-init zsh)"
arb() {
  if [ "$1" = "go" ] || [ "$1" = "main" ]; then
    local dir
    dir=$(command arb "$@" --print-path 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$dir" ] && [ -d "$dir" ]; then
      cd "$dir"
    else
      command arb "$@"
    fi
  elif [ "$1" = "dash" ]; then
    local cd_file="/tmp/arb-dash-cd-$$"
    rm -f "$cd_file"
    ARB_CD_FILE="$cd_file" command arb "$@"
    if [ -f "$cd_file" ]; then
      local dir
      dir=$(cat "$cd_file")
      rm -f "$cd_file"
      if [ -d "$dir" ]; then
        cd "$dir"
      fi
    fi
  else
    command arb "$@"
  fi
}

# Prompt helper: shows worktree name when inside a linked worktree.
# Usage: PS1="\$(arb_ps1)$PS1" or add to your prompt theme.
arb_ps1() {
  local git_dir common_dir branch
  git_dir=$(git rev-parse --git-dir 2>/dev/null) || return
  common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || return
  # Only show indicator in linked worktrees (not the main worktree)
  [ "$git_dir" = "$common_dir" ] && return
  branch=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null) || return
  printf '[wt:%s] ' "$branch"
}
`;

const BASH_INIT = `# arb shell integration for bash
# Add to .bashrc: eval "$(arb shell-init bash)"
arb() {
  if [ "$1" = "go" ] || [ "$1" = "main" ]; then
    local dir
    dir=$(command arb "$@" --print-path 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$dir" ] && [ -d "$dir" ]; then
      cd "$dir"
    else
      command arb "$@"
    fi
  elif [ "$1" = "dash" ]; then
    local cd_file="/tmp/arb-dash-cd-$$"
    rm -f "$cd_file"
    ARB_CD_FILE="$cd_file" command arb "$@"
    if [ -f "$cd_file" ]; then
      local dir
      dir=$(cat "$cd_file")
      rm -f "$cd_file"
      if [ -d "$dir" ]; then
        cd "$dir"
      fi
    fi
  else
    command arb "$@"
  fi
}

# Prompt helper: shows worktree name when inside a linked worktree.
# Usage: PS1="\$(arb_ps1)$PS1" or add to your prompt theme.
arb_ps1() {
  local git_dir common_dir branch
  git_dir=$(git rev-parse --git-dir 2>/dev/null) || return
  common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || return
  [ "$git_dir" = "$common_dir" ] && return
  branch=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null) || return
  printf '[wt:%s] ' "$branch"
}
`;

const FISH_INIT = `# arb shell integration for fish
# Add to config.fish: arb shell-init fish | source
function arb
  if test "$argv[1]" = "go" -o "$argv[1]" = "main"
    set -l dir (command arb $argv --print-path 2>/dev/null)
    if test $status -eq 0 -a -n "$dir" -a -d "$dir"
      cd "$dir"
    else
      command arb $argv
    end
  else if test "$argv[1]" = "dash"
    set -l cd_file "/tmp/arb-dash-cd-$fish_pid"
    rm -f "$cd_file"
    ARB_CD_FILE="$cd_file" command arb $argv
    if test -f "$cd_file"
      set -l dir (cat "$cd_file")
      rm -f "$cd_file"
      if test -d "$dir"
        cd "$dir"
      end
    end
  else
    command arb $argv
  end
end

# Prompt helper: shows worktree name when inside a linked worktree.
# Usage: add (arb_ps1) to your fish_prompt function.
function arb_ps1
  set -l git_dir (git rev-parse --git-dir 2>/dev/null); or return
  set -l common_dir (git rev-parse --git-common-dir 2>/dev/null); or return
  test "$git_dir" = "$common_dir"; and return
  set -l branch (git symbolic-ref --short HEAD 2>/dev/null; or git rev-parse --short HEAD 2>/dev/null); or return
  printf '[wt:%s] ' "$branch"
end
`;
