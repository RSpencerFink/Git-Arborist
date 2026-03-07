export const theme = {
  colors: {
    primary: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    muted: 'gray',
    branch: 'cyan',
    path: 'blue',
    header: 'white',
  },
  symbols: {
    current: '*',
    dirty: '~',
    clean: '✓',
    ahead: '↑',
    behind: '↓',
    untracked: '?',
    staged: '+',
    separator: '│',
    horizontal: '─',
  },
} as const;
