#!/usr/bin/env bun
/**
 * Postinstall: auto-configure shell integration.
 * Runs after `bun add -g git-arborist` or `npm i -g git-arborist`.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SHELL_CONFIGS: Record<string, { rc: string; line: string }> = {
  zsh: { rc: '.zshrc', line: 'eval "$(arb shell-init zsh)"' },
  bash: { rc: '.bashrc', line: 'eval "$(arb shell-init bash)"' },
  fish: { rc: '.config/fish/config.fish', line: 'arb shell-init fish | source' },
};

function detectShell(): string {
  const shell = process.env.SHELL ?? '';
  if (shell.endsWith('/zsh')) return 'zsh';
  if (shell.endsWith('/bash')) return 'bash';
  if (shell.endsWith('/fish')) return 'fish';
  return 'zsh';
}

const shell = detectShell();
const config = SHELL_CONFIGS[shell];
if (!config) process.exit(0);

const rcPath = join(homedir(), config.rc);

if (existsSync(rcPath)) {
  const contents = readFileSync(rcPath, 'utf-8');
  if (contents.includes('arb shell-init')) {
    process.exit(0);
  }
}

try {
  appendFileSync(rcPath, `\n# arb shell integration\n${config.line}\n`);
  console.log(`\x1b[32m✓\x1b[0m arb: Added shell integration to ~/${config.rc}`);
  console.log(`  Restart your shell or run: source ~/${config.rc}`);
} catch {
  // Silent fail — user can run `arb shell-setup` manually
}
