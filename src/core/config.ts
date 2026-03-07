import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export interface SetupCopyConfig {
  from: string;
  to?: string;
}

export interface SetupSymlinkConfig {
  from: string;
  to?: string;
}

export interface SetupRunConfig {
  command: string;
  if_exists?: string;
}

export interface SetupConfig {
  copy?: SetupCopyConfig[];
  symlink?: SetupSymlinkConfig[];
  run?: SetupRunConfig[];
}

export interface PluginConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface GwConfig {
  worktree_path: string;
  editor?: string;
  setup: SetupConfig;
  plugins: Record<string, PluginConfig>;
}

const DEFAULT_CONFIG: GwConfig = {
  worktree_path: '../.worktrees/{{ branch | sanitize }}',
  setup: {
    copy: [],
    symlink: [],
    run: [],
  },
  plugins: {},
};

export function getGlobalConfigPath(): string {
  return join(homedir(), '.config', 'gw', 'config.toml');
}

export function getProjectConfigPath(gitRoot: string): string {
  return join(gitRoot, '.gw.toml');
}

function parseToml(content: string): Record<string, unknown> {
  // Bun has native TOML support - but we need to handle it carefully
  // Use a simple TOML parser for the subset we need
  return parseSimpleToml(content);
}

function parseSimpleToml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentSection: string | null = null;
  let currentArraySection: string | null = null;
  const arrayAccumulators: Record<string, Record<string, unknown>[]> = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    // Array of tables: [[section.name]]
    const arrayMatch = line.match(/^\[\[([^\]]+)\]\]$/);
    if (arrayMatch) {
      currentArraySection = arrayMatch[1];
      currentSection = null;
      if (!arrayAccumulators[currentArraySection]) {
        arrayAccumulators[currentArraySection] = [];
      }
      arrayAccumulators[currentArraySection].push({});
      continue;
    }

    // Table: [section.name]
    const tableMatch = line.match(/^\[([^\]]+)\]$/);
    if (tableMatch) {
      currentSection = tableMatch[1];
      currentArraySection = null;
      continue;
    }

    // Key-value pairs
    const kvMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawValue = kvMatch[2].trim();
      const value = parseTomlValue(rawValue);

      if (currentArraySection) {
        const arr = arrayAccumulators[currentArraySection];
        arr[arr.length - 1][key] = value;
      } else if (currentSection) {
        setNested(result, `${currentSection}.${key}`, value);
      } else {
        result[key] = value;
      }
    }
  }

  // Merge array accumulators into result
  for (const [path, items] of Object.entries(arrayAccumulators)) {
    setNested(result, path, items);
  }

  return result;
}

function parseTomlValue(raw: string): unknown {
  // String (quoted)
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  // Boolean
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  // Number
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  // Array (simple inline)
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw
      .slice(1, -1)
      .split(',')
      .map((s) => parseTomlValue(s.trim()))
      .filter((v) => v !== '');
  }
  return raw;
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

export function loadConfig(gitRoot: string): GwConfig {
  const projectPath = getProjectConfigPath(gitRoot);
  const globalPath = getGlobalConfigPath();

  let projectConfig: Record<string, unknown> = {};
  let globalConfig: Record<string, unknown> = {};

  if (existsSync(globalPath)) {
    try {
      globalConfig = parseToml(readFileSync(globalPath, 'utf-8'));
    } catch {
      // Ignore invalid global config
    }
  }

  if (existsSync(projectPath)) {
    try {
      projectConfig = parseToml(readFileSync(projectPath, 'utf-8'));
    } catch {
      // Ignore invalid project config
    }
  }

  return mergeConfigs(DEFAULT_CONFIG, globalConfig, projectConfig);
}

function mergeConfigs(
  defaults: GwConfig,
  global: Record<string, unknown>,
  project: Record<string, unknown>,
): GwConfig {
  return {
    worktree_path:
      (project.worktree_path as string) ??
      (global.worktree_path as string) ??
      defaults.worktree_path,
    editor: (project.editor as string) ?? (global.editor as string) ?? defaults.editor,
    setup: {
      copy:
        getSetupArray(project, 'setup.copy') ??
        getSetupArray(global, 'setup.copy') ??
        defaults.setup.copy ??
        [],
      symlink:
        getSetupArray(project, 'setup.symlink') ??
        getSetupArray(global, 'setup.symlink') ??
        defaults.setup.symlink ??
        [],
      run:
        getSetupArray(project, 'setup.run') ??
        getSetupArray(global, 'setup.run') ??
        defaults.setup.run ??
        [],
    },
    plugins: {
      ...defaults.plugins,
      ...(getNested(global, 'plugins') as Record<string, PluginConfig> | undefined),
      ...(getNested(project, 'plugins') as Record<string, PluginConfig> | undefined),
    },
  };
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function getSetupArray(obj: Record<string, unknown>, path: string): unknown[] | undefined {
  const val = getNested(obj, path);
  return Array.isArray(val) ? val : undefined;
}
