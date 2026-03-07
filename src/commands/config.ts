import { existsSync, readFileSync } from "node:fs";
import type { GwContext } from "../core/context.ts";
import { getGlobalConfigPath, getProjectConfigPath } from "../core/config.ts";
import { c } from "../utils/color.ts";
import { log } from "../utils/logger.ts";
import { exec } from "../utils/exec.ts";

export async function config(ctx: GwContext, args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case "list": {
      console.log(c.bold("Configuration:"));
      console.log(`  worktree_path: ${c.cyan(ctx.config.worktree_path)}`);
      if (ctx.config.editor) {
        console.log(`  editor: ${c.cyan(ctx.config.editor)}`);
      }

      if (ctx.config.setup.copy?.length) {
        console.log(`\n  ${c.bold("Setup — copy:")}`);
        for (const item of ctx.config.setup.copy) {
          console.log(`    ${(item as { from: string }).from}`);
        }
      }
      if (ctx.config.setup.symlink?.length) {
        console.log(`\n  ${c.bold("Setup — symlink:")}`);
        for (const item of ctx.config.setup.symlink) {
          console.log(`    ${(item as { from: string }).from}`);
        }
      }
      if (ctx.config.setup.run?.length) {
        console.log(`\n  ${c.bold("Setup — run:")}`);
        for (const item of ctx.config.setup.run) {
          console.log(`    ${(item as { command: string }).command}`);
        }
      }

      const pluginEntries = Object.entries(ctx.config.plugins);
      if (pluginEntries.length > 0) {
        console.log(`\n  ${c.bold("Plugins:")}`);
        for (const [name, cfg] of pluginEntries) {
          const status = cfg.enabled ? c.green("enabled") : c.dim("disabled");
          console.log(`    ${name}: ${status}`);
        }
      }
      break;
    }
    case "edit": {
      const scope = args[1] === "--global" ? "global" : "project";
      const configPath =
        scope === "global"
          ? getGlobalConfigPath()
          : getProjectConfigPath(ctx.gitRoot);

      if (!existsSync(configPath)) {
        log.warn(`Config file does not exist: ${c.path(configPath)}`);
        return;
      }

      const editor = process.env.EDITOR ?? "vi";
      const proc = Bun.spawn([editor, configPath], {
        stdio: ["inherit", "inherit", "inherit"],
      });
      await proc.exited;
      break;
    }
    case "get": {
      const key = args[1];
      if (!key) {
        throw new Error("Key required. Usage: gw config get <key>");
      }
      const value = getConfigValue(ctx, key);
      if (value !== undefined) {
        console.log(
          typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value),
        );
      } else {
        log.dim(`Key not found: ${key}`);
      }
      break;
    }
    case "set": {
      log.warn(
        "gw config set is not yet implemented. Edit the config file directly.",
      );
      break;
    }
    default:
      throw new Error("Usage: gw config <list|get|set|edit> [options]");
  }
}

function getConfigValue(ctx: GwContext, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = ctx.config;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
