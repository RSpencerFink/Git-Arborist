import * as vscode from "vscode";
import { gw, handleGwError } from "../cli/gwRunner";
import type { WorktreeItem } from "../cli/types";
import { WorktreeTreeItem } from "./worktreeTreeItem";

export class WorktreeTreeProvider implements vscode.TreeDataProvider<WorktreeTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    WorktreeTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private worktrees: WorktreeItem[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.startAutoRefresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: WorktreeTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<WorktreeTreeItem[]> {
    try {
      this.worktrees = await gw.ls();
      return this.worktrees.map((wt) => new WorktreeTreeItem(wt));
    } catch (err) {
      await handleGwError(err);
      return [];
    }
  }

  getWorktrees(): WorktreeItem[] {
    return this.worktrees;
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    const interval = vscode.workspace
      .getConfiguration("gw")
      .get<number>("autoRefreshInterval", 10000);
    this.refreshTimer = setInterval(() => this.refresh(), interval);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  dispose(): void {
    this.stopAutoRefresh();
    this._onDidChangeTreeData.dispose();
  }
}
