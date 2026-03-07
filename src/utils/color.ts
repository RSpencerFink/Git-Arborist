import pc from 'picocolors';

export const c = {
  bold: pc.bold,
  dim: pc.dim,
  green: pc.green,
  red: pc.red,
  yellow: pc.yellow,
  blue: pc.blue,
  cyan: pc.cyan,
  magenta: pc.magenta,
  gray: pc.gray,
  white: pc.white,
  underline: pc.underline,

  // Semantic
  success: pc.green,
  error: pc.red,
  warn: pc.yellow,
  info: pc.cyan,
  muted: pc.gray,
  branch: pc.cyan,
  path: pc.blue,
  command: (s: string) => pc.bold(pc.white(s)),
};
