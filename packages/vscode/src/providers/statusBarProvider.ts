import * as vscode from "vscode";
import { gw } from "../cli/gwRunner";

export class StatusBarProvider {
  private item: vscode.StatusBarItem;
  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.item.command = "gw.switchWorktree";

    const showStatusBar = vscode.workspace
      .getConfiguration("gw")
      .get<boolean>("showStatusBar", true);

    if (showStatusBar) {
      this.refresh();
      this.startAutoRefresh();
    }
  }

  async refresh(): Promise<void> {
    try {
      const result = await gw.which();
      if (result.current) {
        this.item.text = `$(git-branch) ${result.current} [wt]`;
        this.item.tooltip = "Click to switch worktree";
        this.item.show();
      } else {
        this.item.hide();
      }
    } catch {
      this.item.hide();
    }
  }

  private startAutoRefresh(): void {
    const interval = vscode.workspace
      .getConfiguration("gw")
      .get<number>("autoRefreshInterval", 10000);
    this.refreshTimer = setInterval(() => this.refresh(), interval);
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.item.dispose();
  }
}
