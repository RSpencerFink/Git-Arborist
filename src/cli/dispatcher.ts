import type { GwContext } from "../core/context.ts";
import { createContext } from "../core/context.ts";
import { printHelp, printVersion } from "./help.ts";
import { generateCompletions } from "./completions.ts";
import { generateShellInit } from "./shellInit.ts";
import { log } from "../utils/logger.ts";

interface CommandHandler {
  run: (ctx: GwContext, args: string[]) => Promise<void>;
  needsContext: boolean;
}

const commands: Record<string, () => Promise<CommandHandler>> = {
  add: async () => ({
    run: (await import("../commands/add.ts")).add,
    needsContext: true,
  }),
  rm: async () => ({
    run: (await import("../commands/rm.ts")).rm,
    needsContext: true,
  }),
  go: async () => ({
    run: (await import("../commands/go.ts")).go,
    needsContext: true,
  }),
  ls: async () => ({
    run: (await import("../commands/ls.ts")).ls,
    needsContext: true,
  }),
  main: async () => ({
    run: (await import("../commands/main.ts")).main,
    needsContext: true,
  }),
  status: async () => ({
    run: (await import("../commands/status.ts")).status,
    needsContext: true,
  }),
  prune: async () => ({
    run: (await import("../commands/prune.ts")).prune,
    needsContext: true,
  }),
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
  config: async () => ({
    run: (await import("../commands/config.ts")).config,
    needsContext: true,
  }),
  plugin: async () => ({
    run: (await import("../commands/plugin.ts")).plugin,
    needsContext: true,
  }),
};

export async function dispatch(argv: string[]): Promise<void> {
  const args = argv.slice(2); // Skip 'bun' and script path
  const command = args[0];
  const commandArgs = args.slice(1);

  // Handle top-level flags
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
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

  await handler.run(ctx, commandArgs);
}
