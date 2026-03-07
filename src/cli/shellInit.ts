export function generateShellInit(shell: string): string {
  switch (shell) {
    case "zsh":
      return ZSH_INIT;
    case "bash":
      return BASH_INIT;
    case "fish":
      return FISH_INIT;
    default:
      throw new Error(
        `Unsupported shell: ${shell}. Supported: zsh, bash, fish`,
      );
  }
}

const ZSH_INIT = `# gw shell integration for zsh
# Add to .zshrc: eval "$(gw shell-init zsh)"
gw() {
  if [ "$1" = "go" ] || [ "$1" = "main" ]; then
    local dir
    dir=$(command gw "$@" --print-path 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$dir" ] && [ -d "$dir" ]; then
      cd "$dir"
    else
      command gw "$@"
    fi
  elif [ "$1" = "dash" ]; then
    local cd_file="/tmp/gw-dash-cd-$$"
    rm -f "$cd_file"
    GW_CD_FILE="$cd_file" command gw "$@"
    if [ -f "$cd_file" ]; then
      local dir
      dir=$(cat "$cd_file")
      rm -f "$cd_file"
      if [ -d "$dir" ]; then
        cd "$dir"
      fi
    fi
  else
    command gw "$@"
  fi
}

# Prompt helper: shows worktree name when inside a linked worktree.
# Usage: PS1="\$(gw_ps1)$PS1" or add to your prompt theme.
gw_ps1() {
  local git_dir common_dir branch
  git_dir=$(git rev-parse --git-dir 2>/dev/null) || return
  common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || return
  # Only show indicator in linked worktrees (not the main worktree)
  [ "$git_dir" = "$common_dir" ] && return
  branch=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null) || return
  printf '[wt:%s] ' "$branch"
}
`;

const BASH_INIT = `# gw shell integration for bash
# Add to .bashrc: eval "$(gw shell-init bash)"
gw() {
  if [ "$1" = "go" ] || [ "$1" = "main" ]; then
    local dir
    dir=$(command gw "$@" --print-path 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$dir" ] && [ -d "$dir" ]; then
      cd "$dir"
    else
      command gw "$@"
    fi
  elif [ "$1" = "dash" ]; then
    local cd_file="/tmp/gw-dash-cd-$$"
    rm -f "$cd_file"
    GW_CD_FILE="$cd_file" command gw "$@"
    if [ -f "$cd_file" ]; then
      local dir
      dir=$(cat "$cd_file")
      rm -f "$cd_file"
      if [ -d "$dir" ]; then
        cd "$dir"
      fi
    fi
  else
    command gw "$@"
  fi
}

# Prompt helper: shows worktree name when inside a linked worktree.
# Usage: PS1="\$(gw_ps1)$PS1" or add to your prompt theme.
gw_ps1() {
  local git_dir common_dir branch
  git_dir=$(git rev-parse --git-dir 2>/dev/null) || return
  common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || return
  [ "$git_dir" = "$common_dir" ] && return
  branch=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null) || return
  printf '[wt:%s] ' "$branch"
}
`;

const FISH_INIT = `# gw shell integration for fish
# Add to config.fish: gw shell-init fish | source
function gw
  if test "$argv[1]" = "go" -o "$argv[1]" = "main"
    set -l dir (command gw $argv --print-path 2>/dev/null)
    if test $status -eq 0 -a -n "$dir" -a -d "$dir"
      cd "$dir"
    else
      command gw $argv
    end
  else if test "$argv[1]" = "dash"
    set -l cd_file "/tmp/gw-dash-cd-$fish_pid"
    rm -f "$cd_file"
    GW_CD_FILE="$cd_file" command gw $argv
    if test -f "$cd_file"
      set -l dir (cat "$cd_file")
      rm -f "$cd_file"
      if test -d "$dir"
        cd "$dir"
      end
    end
  else
    command gw $argv
  end
end

# Prompt helper: shows worktree name when inside a linked worktree.
# Usage: add (gw_ps1) to your fish_prompt function.
function gw_ps1
  set -l git_dir (git rev-parse --git-dir 2>/dev/null); or return
  set -l common_dir (git rev-parse --git-common-dir 2>/dev/null); or return
  test "$git_dir" = "$common_dir"; and return
  set -l branch (git symbolic-ref --short HEAD 2>/dev/null; or git rev-parse --short HEAD 2>/dev/null); or return
  printf '[wt:%s] ' "$branch"
end
`;
