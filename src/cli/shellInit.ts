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
  else
    command gw "$@"
  fi
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
  else
    command gw "$@"
  fi
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
  else
    command gw $argv
  end
end
`;
