import { execFile } from "node:child_process";
import * as vscode from "vscode";
import {
  getGwBinaryPath,
  getAugmentedEnv,
  GwBinaryNotFoundError,
} from "./gwBinary";
import type {
  AddResult,
  DashWorktree,
  GwConfig,
  PluginItem,
  PruneResult,
  RmResult,
  WhichResult,
  WorktreeItem,
} from "./types";
import { isGwError } from "./types";

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Git Arborist");
  }
  return outputChannel;
}

interface RunOptions {
  cwd?: string;
  token?: vscode.CancellationToken;
}

async function runGw<T>(args: string[], options?: RunOptions): Promise<T> {
  const binaryPath = await getGwBinaryPath();
  const fullArgs = [...args, "--json"];
  const cwd =
    options?.cwd ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const channel = getOutputChannel();
  channel.appendLine(`$ gw ${args.join(" ")} --json`);

  return new Promise<T>((resolve, reject) => {
    const child = execFile(
      binaryPath,
      fullArgs,
      {
        cwd,
        env: getAugmentedEnv(),
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (stderr) {
          channel.appendLine(`stderr: ${stderr}`);
        }

        if (error && !stdout) {
          channel.appendLine(`error: ${error.message}`);
          reject(new Error(`gw ${args[0]} failed: ${error.message}`));
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          if (isGwError(parsed)) {
            channel.appendLine(`gw error: ${parsed.error} (${parsed.code})`);
            reject(new Error(parsed.error));
            return;
          }
          channel.appendLine(`ok (${stdout.length} bytes)`);
          resolve(parsed as T);
        } catch {
          channel.appendLine(`parse error: ${stdout.slice(0, 200)}`);
          reject(
            new Error(`Failed to parse gw output: ${stdout.slice(0, 200)}`),
          );
        }
      },
    );

    if (options?.token) {
      options.token.onCancellationRequested(() => {
        child.kill();
      });
    }
  });
}

async function runGwRaw(
  args: string[],
  options?: RunOptions,
): Promise<{ stdout: string; exitCode: number }> {
  const binaryPath = await getGwBinaryPath();
  const cwd =
    options?.cwd ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const channel = getOutputChannel();
  channel.appendLine(`$ gw ${args.join(" ")}`);

  return new Promise((resolve, reject) => {
    const child = execFile(
      binaryPath,
      args,
      {
        cwd,
        env: getAugmentedEnv(),
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (stderr) channel.appendLine(`stderr: ${stderr}`);
        const exitCode = error?.code ? Number(error.code) : 0;
        channel.appendLine(`exit: ${exitCode}`);
        resolve({ stdout, exitCode });
      },
    );

    if (options?.token) {
      options.token.onCancellationRequested(() => {
        child.kill();
      });
    }
  });
}

export const gw = {
  ls(options?: RunOptions): Promise<WorktreeItem[]> {
    return runGw<WorktreeItem[]>(["ls"], options);
  },

  status(options?: RunOptions): Promise<WorktreeItem[]> {
    return runGw<WorktreeItem[]>(["status"], options);
  },

  which(options?: RunOptions): Promise<WhichResult> {
    return runGw<WhichResult>(["which"], options);
  },

  configList(options?: RunOptions): Promise<GwConfig> {
    return runGw<GwConfig>(["config", "list"], options);
  },

  pluginList(options?: RunOptions): Promise<PluginItem[]> {
    return runGw<PluginItem[]>(["plugin", "list"], options);
  },

  add(
    branch: string,
    flags?: string[],
    options?: RunOptions,
  ): Promise<AddResult> {
    return runGw<AddResult>(["add", ...(flags ?? []), branch], options);
  },

  rm(name: string, flags?: string[], options?: RunOptions): Promise<RmResult> {
    return runGw<RmResult>(["rm", ...(flags ?? []), name], options);
  },

  pruneDryRun(options?: RunOptions): Promise<PruneResult> {
    return runGw<PruneResult>(["prune", "--dry-run"], options);
  },

  prune(options?: RunOptions): Promise<PruneResult> {
    return runGw<PruneResult>(["prune"], options);
  },

  dash(flags?: string[], options?: RunOptions): Promise<DashWorktree[]> {
    return runGw<DashWorktree[]>(["dash", ...(flags ?? [])], options);
  },

  async init(options?: RunOptions): Promise<void> {
    await runGwRaw(["init"], options);
  },

  async setup(name: string, options?: RunOptions): Promise<string> {
    const result = await runGwRaw(["setup", name], options);
    return result.stdout;
  },

  async gc(options?: RunOptions): Promise<string> {
    const result = await runGwRaw(["gc"], options);
    return result.stdout;
  },

  async clean(name: string, options?: RunOptions): Promise<string> {
    const result = await runGwRaw(["clean", name], options);
    return result.stdout;
  },

  async clone(
    repo: string,
    flags?: string[],
    options?: RunOptions,
  ): Promise<string> {
    const result = await runGwRaw(["clone", ...(flags ?? []), repo], options);
    return result.stdout;
  },

  async run(
    name: string,
    cmd: string[],
    options?: RunOptions,
  ): Promise<string> {
    const result = await runGwRaw(["run", name, "--", ...cmd], options);
    return result.stdout;
  },

  disposeOutputChannel(): void {
    outputChannel?.dispose();
    outputChannel = undefined;
  },
};

export async function handleGwError(err: unknown): Promise<void> {
  if (err instanceof GwBinaryNotFoundError) {
    const action = await vscode.window.showErrorMessage(
      err.message,
      "Open Install Instructions",
    );
    if (action === "Open Install Instructions") {
      vscode.env.openExternal(
        vscode.Uri.parse("https://github.com/gw-cli/gw#installation"),
      );
    }
    return;
  }
  vscode.window.showErrorMessage(
    `gw: ${err instanceof Error ? err.message : String(err)}`,
  );
}
