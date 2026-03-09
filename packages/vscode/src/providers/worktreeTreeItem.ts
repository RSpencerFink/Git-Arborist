import * as vscode from "vscode";
import type { WorktreeItem } from "../cli/types";

export class WorktreeTreeItem extends vscode.TreeItem {
  constructor(public readonly worktree: WorktreeItem) {
    super(
      worktree.isDetached ? `(${worktree.head})` : worktree.branch,
      vscode.TreeItemCollapsibleState.None,
    );

    this.contextValue = worktree.isMain ? "worktreeMain" : "worktree";
    this.description = buildDescription(worktree);
    this.tooltip = buildTooltip(worktree);
    this.iconPath = getIcon(worktree);

    this.command = {
      command: "arborist.switchWorktree",
      title: "Switch to Worktree",
      arguments: [this],
    };
  }
}

function buildDescription(wt: WorktreeItem): string {
  const parts: string[] = [];

  if (wt.isMain) parts.push("[main]");
  if (wt.isCurrent) parts.push("(current)");

  if (wt.status) {
    if (wt.status.dirty) {
      const changes: string[] = [];
      if (wt.status.staged > 0) changes.push(`+${wt.status.staged}`);
      if (wt.status.modified > 0) changes.push(`~${wt.status.modified}`);
      if (wt.status.untracked > 0) changes.push(`?${wt.status.untracked}`);
      parts.push(changes.join(" "));
    }

    if (wt.status.ahead > 0 || wt.status.behind > 0) {
      const sync: string[] = [];
      if (wt.status.ahead > 0) sync.push(`\u2191${wt.status.ahead}`);
      if (wt.status.behind > 0) sync.push(`\u2193${wt.status.behind}`);
      parts.push(sync.join(" "));
    }
  }

  return parts.join(" ");
}

function buildTooltip(wt: WorktreeItem): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.appendMarkdown(`**${wt.branch}**\n\n`);
  md.appendMarkdown(`Path: \`${wt.path}\`\n\n`);
  md.appendMarkdown(`HEAD: \`${wt.head}\`\n\n`);

  if (wt.status) {
    if (wt.status.dirty) {
      md.appendMarkdown(
        `Changes: ${wt.status.staged} staged, ${wt.status.modified} modified, ${wt.status.untracked} untracked\n\n`,
      );
    } else {
      md.appendMarkdown("Working tree clean\n\n");
    }
    if (wt.status.ahead > 0 || wt.status.behind > 0) {
      md.appendMarkdown(
        `Remote: ${wt.status.ahead} ahead, ${wt.status.behind} behind\n\n`,
      );
    }
  }

  return md;
}

function getIcon(wt: WorktreeItem): vscode.ThemeIcon {
  if (wt.isCurrent) {
    return new vscode.ThemeIcon(
      "circle-filled",
      new vscode.ThemeColor("charts.green"),
    );
  }
  if (wt.status?.dirty) {
    return new vscode.ThemeIcon(
      "git-commit",
      new vscode.ThemeColor("charts.yellow"),
    );
  }
  return new vscode.ThemeIcon("git-branch");
}
