import type { GwContext } from "../core/context.ts";
import { createContext } from "../core/context.ts";
import { log } from "../utils/logger.ts";
import { generateCompletions } from "./completions.ts";
import { printHelp, printVersion } from "./help.ts";
import { generateShellInit } from "./shellInit.ts";

interface CommandHandler {
  run: (ctx: GwContext, args: string[]) => Promise<void>;
  runJson?: (ctx: GwContext, args: string[]) => Promise<unknown>;
  needsContext: boolean;
}

const commands: Record<string, () => Promise<CommandHandler>> = {
  add: async () => {
    const mod = await import("../commands/add.ts");
    return { run: mod.add, runJson: mod.addJson, needsContext: true };
  },
  rm: async () => {
    const mod = await import("../commands/rm.ts");
    return { run: mod.rm, runJson: mod.rmJson, needsContext: true };
  },
  go: async () => ({
    run: (await import("../commands/go.ts")).go,
    needsContext: true,
  }),
  ls: async () => {
    const mod = await import("../commands/ls.ts");
    return { run: mod.ls, runJson: mod.lsJson, needsContext: true };
  },
  main: async () => ({
    run: (await import("../commands/main.ts")).main,
    needsContext: true,
  }),
  status: async () => {
    const mod = await import("../commands/status.ts");
    return { run: mod.status, runJson: mod.statusJson, needsContext: true };
  },
  dash: async () => {
    const mod = await import("../commands/dash.ts");
    return { run: mod.dash, runJson: mod.dashJson, needsContext: true };
  },
  prune: async () => {
    const mod = await import("../commands/prune.ts");
    return { run: mod.prune, runJson: mod.pruneJson, needsContext: true };
  },
  gc: async () => ({
    run: (await import("../commands/gc.ts")).gc,
    needsContext: true,
  }),
  clean: async () => ({
    run: (await import("../commands/clean.ts")).clean,
    needsContext: true,
  }),
  init: async () => ({
    run: (await import("../commands/init.ts")).init,
    needsContext: true,
  }),
  setup: async () => ({
    run: (await import("../commands/setup.ts")).setup,
    needsContext: true,
  }),
  "shell-setup": async () => ({
    run: (await import("../commands/shellSetup.ts")).shellSetup,
    needsContext: false,
  }),
  clone: async () => ({
    run: async (_ctx: GwContext, args: string[]) => {
      const { clone } = await import("../commands/clone.ts");
      await clone(null, args);
    },
    needsContext: false,
  }),
  run: async () => ({
    run: (await import("../commands/run.ts")).run,
    needsContext: true,
  }),
  open: async () => ({
    run: (await import("../commands/open.ts")).open,
    needsContext: true,
  }),
  tmux: async () => ({
    run: (await import("../commands/tmux.ts")).tmux,
    needsContext: true,
  }),
  config: async () => {
    const mod = await import("../commands/config.ts");
    return { run: mod.config, runJson: mod.configJson, needsContext: true };
  },
  plugin: async () => {
    const mod = await import("../commands/plugin.ts");
    return { run: mod.plugin, runJson: mod.pluginJson, needsContext: true };
  },
  which: async () => {
    const mod = await import("../commands/which.ts");
    return { run: mod.which, runJson: mod.whichJson, needsContext: true };
  },
};

export async function dispatch(argv: string[]): Promise<void> {
  const args = argv.slice(2); // Skip 'bun' and script path
  const jsonIndex = args.indexOf("--json");
  const jsonMode = jsonIndex !== -1;
  const filteredArgs = jsonMode
    ? [...args.slice(0, jsonIndex), ...args.slice(jsonIndex + 1)]
    : args;

  const command = filteredArgs[0];
  const commandArgs = filteredArgs.slice(1);

  // Handle top-level flags
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
    if (jsonMode) {
      const { VERSION } = await import("../version.ts");
      console.log(JSON.stringify({ version: VERSION }));
      return;
    }
    printVersion();
    return;
  }

  // Handle completions and shell-init without context
  if (command === "completions") {
    const shell = commandArgs[0];
    if (!shell) {
      throw new Error(
        "Shell argument required. Usage: gw completions <zsh|bash|fish>",
      );
    }
    console.log(generateCompletions(shell));
    return;
  }

  if (command === "shell-init") {
    const shell = commandArgs[0];
    if (!shell) {
      throw new Error(
        "Shell argument required. Usage: gw shell-init <zsh|bash|fish>",
      );
    }
    console.log(generateShellInit(shell));
    return;
  }

  // Look up command handler
  const loader = commands[command];
  if (!loader) {
    if (jsonMode) {
      console.log(
        JSON.stringify({
          error: `Unknown command: ${command}`,
          code: "UNKNOWN_COMMAND",
        }),
      );
      process.exit(1);
    }
    log.error(`Unknown command: ${command}`);
    log.dim("Run gw --help to see available commands.");
    process.exit(1);
  }

  const handler = await loader();

  // Create context if needed
  let ctx: GwContext;
  if (handler.needsContext) {
    ctx = await createContext();
  } else {
    // Provide a minimal context for commands that don't need git
    ctx = {
      gitRoot: process.cwd(),
      config: {
        worktree_path: "../.worktrees/{{ branch | sanitize }}",
        setup: { copy: [], symlink: [], run: [] },
        plugins: {},
      },
      cwd: process.cwd(),
    };
  }

  if (jsonMode) {
    if (!handler.runJson) {
      console.log(
        JSON.stringify({
          error: `Command '${command}' does not support --json`,
          code: "NO_JSON",
        }),
      );
      process.exit(1);
    }
    try {
      const result = await handler.runJson(ctx, commandArgs);
      console.log(JSON.stringify(result));
    } catch (err) {
      console.log(
        JSON.stringify({
          error: (err as Error).message,
          code: "COMMAND_ERROR",
        }),
      );
      process.exit(1);
    }
    return;
  }

  await handler.run(ctx, commandArgs);
}
