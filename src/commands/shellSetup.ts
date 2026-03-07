import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { GwContext } from '../core/context.ts';
import { c } from '../utils/color.ts';
import { log } from '../utils/logger.ts';

const SHELL_CONFIGS: Record<string, { rc: string; line: string }> = {
  zsh: {
    rc: '.zshrc',
    line: 'eval "$(gw shell-init zsh)"',
  },
  bash: {
    rc: '.bashrc',
    line: 'eval "$(gw shell-init bash)"',
  },
  fish: {
    rc: '.config/fish/config.fish',
    line: 'gw shell-init fish | source',
  },
};

function detectShell(): string {
  const shell = process.env.SHELL ?? '';
  if (shell.endsWith('/zsh')) return 'zsh';
  if (shell.endsWith('/bash')) return 'bash';
  if (shell.endsWith('/fish')) return 'fish';
  return 'zsh';
}

export async function shellSetup(_ctx: GwContext, _args: string[]): Promise<void> {
  const shell = detectShell();
  const config = SHELL_CONFIGS[shell];

  if (!config) {
    log.error(`Unsupported shell: ${shell}`);
    return;
  }

  const rcPath = join(homedir(), config.rc);

  if (existsSync(rcPath)) {
    const contents = readFileSync(rcPath, 'utf-8');
    if (contents.includes('gw shell-init')) {
      log.success(`Shell integration already configured in ${c.dim(rcPath)}`);
      return;
    }
  }

  appendFileSync(rcPath, `\n# gw shell integration\n${config.line}\n`);
  log.success(`Added shell integration to ${c.dim(rcPath)}`);
  log.info(`Restart your shell or run: ${c.cyan(`source ~/${config.rc}`)}`);
}
