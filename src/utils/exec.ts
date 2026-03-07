import { $ } from "bun";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function exec(
  cmd: string[],
  options?: { cwd?: string },
): Promise<ExecResult> {
  const proc = Bun.spawn(cmd, {
    cwd: options?.cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  return {
    stdout: stdout.trimEnd(),
    stderr: stderr.trimEnd(),
    exitCode,
  };
}

export async function execOrThrow(
  cmd: string[],
  options?: { cwd?: string },
): Promise<string> {
  const result = await exec(cmd, options);
  if (result.exitCode !== 0) {
    throw new Error(`Command failed: ${cmd.join(" ")}\n${result.stderr}`);
  }
  return result.stdout;
}
