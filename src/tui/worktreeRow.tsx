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
  const marker = isSelected ? '▸' : isCurrent ? '*' : ' ';

  return (
    <Box flexDirection="row" paddingLeft={1}>
      <Box width={3}>
        <Text color={isSelected ? theme.colors.primary : undefined} bold={isSelected}>
          {marker}
        </Text>
      </Box>

      <Box width={28}>
        <Text
          color={
            isSelected
              ? theme.colors.primary
              : isCurrent
                ? theme.colors.success
                : theme.colors.branch
          }
          bold={isSelected || isCurrent}
          inverse={isSelected}
        >
          {wt.isDetached ? `(${wt.head})` : wt.branch}
        </Text>
        {wt.isMain && <Text color={theme.colors.muted}> [main]</Text>}
      </Box>

      <Box width={10}>
        <Text color={theme.colors.muted}>{wt.head}</Text>
      </Box>

      <Box width={30}>
        <ChangesCell status={status} />
      </Box>

      <Box width={16}>
        <RemoteCell status={status} />
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

function ChangesCell({ status }: { status: BranchStatus | null }) {
  if (!status) {
    return <Text color={theme.colors.muted}>?</Text>;
  }

  if (!status.dirty) {
    return <Text color={theme.colors.success}>{theme.symbols.clean} clean</Text>;
  }

  const total = status.staged + status.modified + status.untracked;
  const parts: string[] = [];
  if (status.staged > 0) parts.push(`${status.staged} staged`);
  if (status.modified > 0) parts.push(`${status.modified} modified`);
  if (status.untracked > 0) parts.push(`${status.untracked} new`);

  return (
    <Text color={theme.colors.warning}>
      {total} file{total !== 1 ? 's' : ''}{' '}
      <Text color={theme.colors.muted}>({parts.join(', ')})</Text>
    </Text>
  );
}

function RemoteCell({ status }: { status: BranchStatus | null }) {
  if (!status) {
    return <Text color={theme.colors.muted}>—</Text>;
  }

  if (status.ahead === 0 && status.behind === 0) {
    return <Text color={theme.colors.success}>up to date</Text>;
  }

  const parts: string[] = [];
  if (status.ahead > 0) parts.push(`${status.ahead} to push`);
  if (status.behind > 0) parts.push(`${status.behind} to pull`);

  return (
    <Text color={status.behind > 0 ? theme.colors.warning : theme.colors.success}>
      {parts.join(', ')}
    </Text>
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
