import { getGitRoot } from "./git.ts";
import { loadConfig, type GwConfig } from "./config.ts";

export interface GwContext {
  gitRoot: string;
  config: GwConfig;
  cwd: string;
}

export async function createContext(cwd?: string): Promise<GwContext> {
  const effectiveCwd = cwd ?? process.cwd();
  const gitRoot = await getGitRoot(effectiveCwd);
  const config = loadConfig(gitRoot);

  return {
    gitRoot,
    config,
    cwd: effectiveCwd,
  };
}
