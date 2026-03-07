import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execOrThrow, exec } from "../../src/utils/exec.ts";

const TEST_DIR = join(import.meta.dir, "..", "fixtures", "lifecycle-test");
const GW = join(import.meta.dir, "..", "..", "src", "index.ts");

async function gw(
  args: string,
  cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return exec(["bun", "run", GW, ...args.split(" ")], { cwd });
}

describe("worktree lifecycle", () => {
  beforeAll(async () => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });

    // Create a test git repo
    await execOrThrow(["git", "init"], { cwd: TEST_DIR });
    await execOrThrow(["git", "config", "user.email", "test@test.com"], {
      cwd: TEST_DIR,
    });
    await execOrThrow(["git", "config", "user.name", "Test"], {
      cwd: TEST_DIR,
    });
    await Bun.write(join(TEST_DIR, "README.md"), "# Test");
    await execOrThrow(["git", "add", "."], { cwd: TEST_DIR });
    await execOrThrow(["git", "commit", "-m", "init"], { cwd: TEST_DIR });
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    // Also clean up any worktrees created
    rmSync(join(TEST_DIR, "..", ".worktrees"), {
      recursive: true,
      force: true,
    });
  });

  test("gw ls shows main worktree", async () => {
    const result = await gw("ls", TEST_DIR);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("main");
  });

  test("gw add -b creates worktree", async () => {
    const result = await gw("add -b test-branch", TEST_DIR);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Worktree created");
  });

  test("gw ls shows new worktree", async () => {
    const result = await gw("ls", TEST_DIR);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("test-branch");
  });

  test("gw go prints path", async () => {
    const result = await gw("go test-branch --print-path", TEST_DIR);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("test-branch");
  });

  test("gw status shows table", async () => {
    const result = await gw("status", TEST_DIR);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Branch");
    expect(result.stdout).toContain("main");
    expect(result.stdout).toContain("test-branch");
  });

  test("gw rm removes worktree", async () => {
    const result = await gw("rm test-branch", TEST_DIR);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Removed");
  });

  test("gw ls no longer shows removed worktree", async () => {
    const result = await gw("ls", TEST_DIR);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("test-branch");
  });
});
