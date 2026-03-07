import { Box, Text } from 'ink';
import React from 'react';
import type { BranchStatus, WorktreeInfo } from '../core/git.ts';
import { theme } from './theme.ts';

interface WorktreeRowProps {
  wt: WorktreeInfo;
  status: BranchStatus | null;
  isCurrent: boolean;
  prInfo?: {
    number: number;
    state: string;
    url: string;
    ciStatus?: string;
  } | null;
  graphiteInfo?: { stack?: string; position?: string } | null;
  isSelected: boolean;
}

export function WorktreeRow({
  wt,
  status,
  isCurrent,
  prInfo,
  graphiteInfo,
  isSelected,
}: WorktreeRowProps) {
  const marker = isCurrent ? theme.symbols.current : ' ';

  return (
    <Box flexDirection="row" paddingLeft={1}>
      <Box width={3}>
        <Text color={isSelected ? theme.colors.primary : undefined} bold={isSelected}>
          {marker}
        </Text>
      </Box>

      <Box width={28}>
        <Text color={isCurrent ? theme.colors.success : theme.colors.branch} bold={isCurrent}>
          {wt.isDetached ? `(${wt.head})` : wt.branch}
        </Text>
        {wt.isMain && <Text color={theme.colors.muted}> [main]</Text>}
      </Box>

      <Box width={10}>
        <Text color={theme.colors.muted}>{wt.head}</Text>
      </Box>

      <Box width={16}>
        <StatusCell status={status} />
      </Box>

      <Box width={12}>
        <SyncCell status={status} />
      </Box>

      {prInfo && (
        <Box width={18}>
          <PrCell prInfo={prInfo} />
        </Box>
      )}

      {graphiteInfo && (
        <Box width={16}>
          <GraphiteCell info={graphiteInfo} />
        </Box>
      )}

      <Box flexShrink={1}>
        <Text color={theme.colors.muted}>{wt.path}</Text>
      </Box>
    </Box>
  );
}

function StatusCell({ status }: { status: BranchStatus | null }) {
  if (!status) {
    return <Text color={theme.colors.muted}>?</Text>;
  }

  if (!status.dirty) {
    return <Text color={theme.colors.success}>{theme.symbols.clean} clean</Text>;
  }

  return (
    <Box>
      {status.staged > 0 && (
        <Text color={theme.colors.success}>
          {theme.symbols.staged}
          {status.staged}{' '}
        </Text>
      )}
      {status.modified > 0 && (
        <Text color={theme.colors.warning}>
          {theme.symbols.dirty}
          {status.modified}{' '}
        </Text>
      )}
      {status.untracked > 0 && (
        <Text color={theme.colors.muted}>
          {theme.symbols.untracked}
          {status.untracked}
        </Text>
      )}
    </Box>
  );
}

function SyncCell({ status }: { status: BranchStatus | null }) {
  if (!status) {
    return <Text color={theme.colors.muted}>—</Text>;
  }

  if (status.ahead === 0 && status.behind === 0) {
    return <Text color={theme.colors.muted}>—</Text>;
  }

  return (
    <Box>
      {status.ahead > 0 && (
        <Text color={theme.colors.success}>
          {theme.symbols.ahead}
          {status.ahead}{' '}
        </Text>
      )}
      {status.behind > 0 && (
        <Text color={theme.colors.error}>
          {theme.symbols.behind}
          {status.behind}
        </Text>
      )}
    </Box>
  );
}

function PrCell({
  prInfo,
}: {
  prInfo: { number: number; state: string; url: string; ciStatus?: string };
}) {
  const stateColor =
    prInfo.state === 'MERGED'
      ? theme.colors.success
      : prInfo.state === 'CLOSED'
        ? theme.colors.error
        : theme.colors.primary;

  const ciColor =
    prInfo.ciStatus === 'SUCCESS'
      ? theme.colors.success
      : prInfo.ciStatus === 'FAILURE'
        ? theme.colors.error
        : prInfo.ciStatus === 'PENDING'
          ? theme.colors.warning
          : theme.colors.muted;

  return (
    <Box>
      <Text color={stateColor}>#{prInfo.number}</Text>
      {prInfo.ciStatus && (
        <Text color={ciColor}>
          {' '}
          {prInfo.ciStatus === 'SUCCESS' ? '✓' : prInfo.ciStatus === 'FAILURE' ? '✗' : '○'}
        </Text>
      )}
    </Box>
  );
}

function GraphiteCell({
  info,
}: {
  info: { stack?: string; position?: string };
}) {
  if (!info.stack) {
    return <Text color={theme.colors.muted}>—</Text>;
  }

  return (
    <Box>
      <Text color={theme.colors.primary}>{info.stack}</Text>
      {info.position && <Text color={theme.colors.muted}> {info.position}</Text>}
    </Box>
  );
}
