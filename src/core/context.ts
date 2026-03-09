import { type ArboristConfig, loadConfig } from './config.ts';
import { getGitRoot } from './git.ts';

export interface ArboristContext {
  gitRoot: string;
  config: ArboristConfig;
  cwd: string;
}

export async function createContext(cwd?: string): Promise<ArboristContext> {
  const effectiveCwd = cwd ?? process.cwd();
  const gitRoot = await getGitRoot(effectiveCwd);
  const config = loadConfig(gitRoot);

  return {
    gitRoot,
    config,
    cwd: effectiveCwd,
  };
}
