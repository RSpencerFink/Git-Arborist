import { writeFileSync } from 'node:fs';
import { Box, Text, render, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import React, { useState, useEffect, useCallback } from 'react';
import type { GwContext } from '../core/context.ts';
import {
  type BranchStatus,
  type WorktreeInfo,
  getBranchStatus,
  listWorktrees,
} from '../core/git.ts';
import { exec } from '../utils/exec.ts';
import { VERSION } from '../version.ts';
import { theme } from './theme.ts';
import { WorktreeRow } from './worktreeRow.tsx';

interface WorktreeState {
  wt: WorktreeInfo;
  status: BranchStatus | null;
  prInfo?: {
    number: number;
    state: string;
    url: string;
    ciStatus?: string;
  } | null;
  graphiteInfo?: { stack?: string; position?: string } | null;
}

interface DashboardProps {
  ctx: GwContext;
  showPr: boolean;
  showGraphite: boolean;
}

function Dashboard({ ctx, showPr, showGraphite }: DashboardProps) {
  const [worktrees, setWorktrees] = useState<WorktreeState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [switchTo, setSwitchTo] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const { exit } = useApp();

  useEffect(() => {
    checkForUpdate().then((v) => setLatestVersion(v));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const wts = await listWorktrees(ctx.gitRoot);
      const nonBare = wts.filter((wt) => !wt.isBare);

      const states: WorktreeState[] = await Promise.all(
        nonBare.map(async (wt) => {
          let status: BranchStatus | null = null;
          try {
            status = await getBranchStatus(wt.branch, wt.path);
          } catch {
            // Skip status on error
          }

          let prInfo: WorktreeState['prInfo'] = null;
          if (showPr && wt.branch && !wt.isMain) {
            prInfo = await fetchPrInfo(wt.branch, ctx.gitRoot);
          }

          let graphiteInfo: WorktreeState['graphiteInfo'] = null;
          if (showGraphite && wt.branch) {
            graphiteInfo = await fetchGraphiteInfo(wt.branch, wt.path);
          }

          return { wt, status, prInfo, graphiteInfo };
        }),
      );

      setWorktrees(states);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [ctx.gitRoot, showPr, showGraphite]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }
    if (input === 'r') {
      refresh();
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(worktrees.length - 1, i + 1));
    }
    if (key.return && worktrees[selectedIndex]) {
      setSwitchTo(worktrees[selectedIndex].wt.path);
      exit();
    }
  });

  const cdFile = process.env.GW_CD_FILE;
  const hasShellWrapper = Boolean(cdFile);

  useEffect(() => {
    if (switchTo && cdFile) {
      writeFileSync(cdFile, switchTo);
    }
  }, [switchTo, cdFile]);

  const currentPath = process.cwd();

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={theme.colors.header}>
          gw dashboard
        </Text>
        <Text color={theme.colors.muted}>
          {' '}
          {theme.symbols.separator} {worktrees.length} worktree
          {worktrees.length !== 1 ? 's' : ''} {theme.symbols.separator} refreshed{' '}
          {lastRefresh.toLocaleTimeString()}{' '}
        </Text>
        {loading && (
          <Text color={theme.colors.primary}>
            <Spinner type="dots" />
          </Text>
        )}
      </Box>

      {latestVersion && latestVersion !== VERSION && (
        <Box marginBottom={1}>
          <Text color={theme.colors.warning}>
            Update available: {VERSION} → {latestVersion} — run{' '}
          </Text>
          <Text color={theme.colors.primary} bold>
            bun add -g git-arborist@latest
          </Text>
        </Box>
      )}

      {error && (
        <Box marginBottom={1}>
          <Text color={theme.colors.error}>Error: {error}</Text>
        </Box>
      )}

      {/* Column headers */}
      <Box flexDirection="row" paddingLeft={1}>
        <Box width={3}>
          <Text bold color={theme.colors.muted}>
            {' '}
          </Text>
        </Box>
        <Box width={28}>
          <Text bold color={theme.colors.muted}>
            Branch
          </Text>
        </Box>
        <Box width={10}>
          <Text bold color={theme.colors.muted}>
            Head
          </Text>
        </Box>
        <Box width={30}>
          <Text bold color={theme.colors.muted}>
            Changes
          </Text>
        </Box>
        <Box width={16}>
          <Text bold color={theme.colors.muted}>
            Remote
          </Text>
        </Box>
        {showPr && (
          <Box width={18}>
            <Text bold color={theme.colors.muted}>
              PR
            </Text>
          </Box>
        )}
        {showGraphite && (
          <Box width={16}>
            <Text bold color={theme.colors.muted}>
              Stack
            </Text>
          </Box>
        )}
        <Box flexShrink={1}>
          <Text bold color={theme.colors.muted}>
            Path
          </Text>
        </Box>
      </Box>

      <Box>
        <Text color={theme.colors.muted}>{theme.symbols.horizontal.repeat(100)}</Text>
      </Box>

      {/* Worktree rows */}
      {worktrees.map((state, index) => (
        <WorktreeRow
          key={state.wt.path}
          wt={state.wt}
          status={state.status}
          isCurrent={state.wt.path === currentPath || currentPath.startsWith(`${state.wt.path}/`)}
          prInfo={state.prInfo}
          graphiteInfo={state.graphiteInfo}
          isSelected={index === selectedIndex}
        />
      ))}

      {/* Footer */}
      {!hasShellWrapper && (
        <Box marginTop={1}>
          <Text color={theme.colors.warning}>Shell integration required for switching. Run: </Text>
          <Text color={theme.colors.primary} bold>
            gw shell-setup
          </Text>
        </Box>
      )}
      <Box marginTop={hasShellWrapper ? 1 : 0}>
        <Text color={theme.colors.muted}>
          [↑/↓] navigate{hasShellWrapper ? ' [enter] switch' : ''} [r] refresh [q] quit
        </Text>
      </Box>
    </Box>
  );
}

async function checkForUpdate(): Promise<string | null> {
  try {
    const resp = await fetch('https://registry.npmjs.org/git-arborist/latest');
    if (!resp.ok) return null;
    const data = (await resp.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

async function fetchPrInfo(
  branch: string,
  cwd: string,
): Promise<{
  number: number;
  state: string;
  url: string;
  ciStatus?: string;
} | null> {
  try {
    const result = await exec(
      ['gh', 'pr', 'view', branch, '--json', 'number,state,url,statusCheckRollup'],
      { cwd },
    );

    if (result.exitCode !== 0) return null;

    const data = JSON.parse(result.stdout);

    let ciStatus: string | undefined;
    if (data.statusCheckRollup && data.statusCheckRollup.length > 0) {
      const states = data.statusCheckRollup.map(
        (c: { conclusion?: string; status?: string }) => c.conclusion ?? c.status,
      );
      if (states.every((s: string) => s === 'SUCCESS')) {
        ciStatus = 'SUCCESS';
      } else if (states.some((s: string) => s === 'FAILURE')) {
        ciStatus = 'FAILURE';
      } else {
        ciStatus = 'PENDING';
      }
    }

    return {
      number: data.number,
      state: data.state,
      url: data.url,
      ciStatus,
    };
  } catch {
    return null;
  }
}

async function fetchGraphiteInfo(
  branch: string,
  cwd: string,
): Promise<{ stack?: string; position?: string } | null> {
  try {
    const result = await exec(['gt', 'log', 'short', '--json'], { cwd });
    if (result.exitCode !== 0) return null;

    const data = JSON.parse(result.stdout);
    if (!Array.isArray(data)) return null;

    const entry = data.find((e: { branch?: string }) => e.branch === branch);
    if (!entry) return null;

    return {
      stack: entry.stack ?? undefined,
      position: entry.index !== undefined ? `${entry.index + 1}/${data.length}` : undefined,
    };
  } catch {
    return null;
  }
}

export function renderDashboard(
  ctx: GwContext,
  options: { showPr: boolean; showGraphite: boolean },
) {
  if (!process.stdin.isTTY) {
    console.error('gw dash requires an interactive terminal (TTY).');
    process.exit(1);
  }

  render(<Dashboard ctx={ctx} showPr={options.showPr} showGraphite={options.showGraphite} />);
}
