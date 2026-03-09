import * as vscode from "vscode";
import { clearBinaryCache } from "./cli/gwBinary";
import { gw } from "./cli/gwRunner";
import { addWorktree } from "./commands/addWorktree";
import { pruneWorktrees } from "./commands/pruneWorktrees";
import { removeWorktree } from "./commands/removeWorktree";
import {
  cleanWorktree,
  cloneRepo,
  editConfig,
  garbageCollect,
  initConfig,
  runInWorktree,
  runSetup,
} from "./commands/simpleCommands";
import {
  openWorktreeInNewWindow,
  switchToMain,
  switchWorktree,
} from "./commands/switchWorktree";
import { PluginTreeProvider } from "./providers/pluginTreeProvider";
import { StatusBarProvider } from "./providers/statusBarProvider";
import { WorktreeTreeProvider } from "./providers/worktreeTreeProvider";
import { FileWatcher } from "./utils/fileWatcher";
import { DashboardPanel } from "./views/dashboardPanel";

export function activate(context: vscode.ExtensionContext): void {
  const worktreeProvider = new WorktreeTreeProvider();
  const pluginProvider = new PluginTreeProvider();
  const statusBar = new StatusBarProvider();
  const fileWatcher = new FileWatcher();

  // Register tree views
  const worktreeView = vscode.window.createTreeView("gw.worktreeView", {
    treeDataProvider: worktreeProvider,
    showCollapseAll: false,
  });

  const pluginView = vscode.window.createTreeView("gw.pluginView", {
    treeDataProvider: pluginProvider,
  });

  // File watcher triggers refresh
  fileWatcher.watch(() => {
    worktreeProvider.refresh();
    pluginProvider.refresh();
    statusBar.refresh();
  });

  // Listen for config changes
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("gw.binaryPath")) {
      clearBinaryCache();
      worktreeProvider.refresh();
    }
    if (e.affectsConfiguration("gw.showStatusBar")) {
      statusBar.refresh();
    }
  });

  // Register commands
  const commands: Array<[string, (...args: unknown[]) => unknown]> = [
    ["gw.addWorktree", addWorktree],
    ["gw.removeWorktree", removeWorktree],
    ["gw.switchWorktree", switchWorktree],
    ["gw.switchToMain", switchToMain],
    ["gw.pruneWorktrees", pruneWorktrees],
    ["gw.cleanWorktree", cleanWorktree],
    ["gw.garbageCollect", garbageCollect],
    ["gw.cloneRepo", cloneRepo],
    ["gw.initConfig", initConfig],
    ["gw.runSetup", runSetup],
    ["gw.runInWorktree", runInWorktree],
    ["gw.editConfig", editConfig],
    ["gw.openWorktreeInNewWindow", openWorktreeInNewWindow],
    ["gw.setupWorktree", runSetup],
    ["gw.openDashboard", () => DashboardPanel.show()],
    [
      "gw.refreshWorktrees",
      () => {
        worktreeProvider.refresh();
        pluginProvider.refresh();
        statusBar.refresh();
      },
    ],
  ];

  for (const [id, handler] of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));
  }

  // Push disposables
  context.subscriptions.push(
    worktreeView,
    pluginView,
    worktreeProvider,
    statusBar,
    fileWatcher,
  );
}

export function deactivate(): void {
  gw.disposeOutputChannel();
}
