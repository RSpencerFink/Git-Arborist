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

function getShellConfig() {
  const shell = detectShell();
  const config = SHELL_CONFIGS[shell];
  if (!config) return null;
  return { shell, ...config };
}

export function isShellIntegrationConfigured(): boolean {
  const config = getShellConfig();
  if (!config) return false;
  const rcPath = join(homedir(), config.rc);
  if (!existsSync(rcPath)) return false;
  return readFileSync(rcPath, 'utf-8').includes('gw shell-init');
}

export function runShellSetup(): boolean {
  const config = getShellConfig();
  if (!config) return false;

  const rcPath = join(homedir(), config.rc);

  if (existsSync(rcPath)) {
    const contents = readFileSync(rcPath, 'utf-8');
    if (contents.includes('gw shell-init')) return true;
  }

  try {
    appendFileSync(rcPath, `\n# gw shell integration\n${config.line}\n`);
    log.success(`Added shell integration to ${c.dim(rcPath)}`);
    log.info(`Restart your shell or run: ${c.cyan(`source ~/${config.rc}`)}`);
    return true;
  } catch {
    return false;
  }
}

async function promptAndSetup(): Promise<void> {
  const { confirm, isCancel } = await import('@clack/prompts');
  const shouldSetup = await confirm({
    message: 'Shell integration is required for this command. Set it up now?',
  });

  if (isCancel(shouldSetup) || !shouldSetup) {
    log.dim('You can set it up later with: gw shell-setup');
    process.exit(0);
  }

  if (!runShellSetup()) {
    log.error('Failed to configure shell integration.');
    process.exit(1);
  }

  log.info('');
  log.info(c.yellow('Restart your shell, then re-run your command.'));
  process.exit(0);
}

/** For go/main: checks rc file, prompts if missing. */
export async function ensureShellIntegration(): Promise<void> {
  if (isShellIntegrationConfigured()) return;
  await promptAndSetup();
}

/** For dash: checks GW_CD_FILE env var to confirm wrapper is active. */
export async function ensureShellIntegrationActive(): Promise<void> {
  if (process.env.GW_CD_FILE) return;

  if (isShellIntegrationConfigured()) {
    const config = getShellConfig();
    const rc = config ? `~/${config.rc}` : 'your shell config';
    log.warn('Shell integration is configured but not active in this session.');
    log.info(`Run: ${c.cyan(`source ${rc}`)} or restart your shell.`);
    process.exit(0);
  }

  await promptAndSetup();
}

export async function shellSetup(_ctx: GwContext, _args: string[]): Promise<void> {
  if (isShellIntegrationConfigured()) {
    const config = getShellConfig();
    const rcPath = config ? join(homedir(), config.rc) : '~/.zshrc';
    log.success(`Shell integration already configured in ${c.dim(rcPath)}`);
    return;
  }

  if (!runShellSetup()) {
    log.error('Failed to configure shell integration.');
  }
}
