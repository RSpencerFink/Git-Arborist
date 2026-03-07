import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "../../src/core/config.ts";

const TEST_DIR = join(import.meta.dir, "..", "fixtures", "config-test");

describe("loadConfig", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test("returns defaults when no config files exist", () => {
    const config = loadConfig(TEST_DIR);
    expect(config.worktree_path).toBe("../.worktrees/{{ branch | sanitize }}");
    expect(config.setup.copy).toEqual([]);
    expect(config.setup.symlink).toEqual([]);
    expect(config.setup.run).toEqual([]);
  });

  test("loads project config", () => {
    writeFileSync(
      join(TEST_DIR, ".gw.toml"),
      `worktree_path = "../my-worktrees/{{ branch }}"
editor = "nvim"
`,
    );

    const config = loadConfig(TEST_DIR);
    expect(config.worktree_path).toBe("../my-worktrees/{{ branch }}");
    expect(config.editor).toBe("nvim");
  });

  test("loads plugin config", () => {
    writeFileSync(
      join(TEST_DIR, ".gw.toml"),
      `[plugins.deps]
enabled = true
strategy = "install"
`,
    );

    const config = loadConfig(TEST_DIR);
    expect(config.plugins.deps).toBeDefined();
    expect(config.plugins.deps.enabled).toBe(true);
  });
});
