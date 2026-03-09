import * as vscode from "vscode";
import { clearBinaryCache } from "./cli/gwBinary";
import { arb } from "./cli/gwRunner";
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
  const worktreeView = vscode.window.createTreeView("arborist.worktreeView", {
    treeDataProvider: worktreeProvider,
    showCollapseAll: false,
  });

  const pluginView = vscode.window.createTreeView("arborist.pluginView", {
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
    if (e.affectsConfiguration("arborist.binaryPath")) {
      clearBinaryCache();
      worktreeProvider.refresh();
    }
    if (e.affectsConfiguration("arborist.showStatusBar")) {
      statusBar.refresh();
    }
  });

  // Register commands
  const commands: Array<[string, (...args: unknown[]) => unknown]> = [
    ["arborist.addWorktree", addWorktree],
    ["arborist.removeWorktree", removeWorktree],
    ["arborist.switchWorktree", switchWorktree],
    ["arborist.switchToMain", switchToMain],
    ["arborist.pruneWorktrees", pruneWorktrees],
    ["arborist.cleanWorktree", cleanWorktree],
    ["arborist.garbageCollect", garbageCollect],
    ["arborist.cloneRepo", cloneRepo],
    ["arborist.initConfig", initConfig],
    ["arborist.runSetup", runSetup],
    ["arborist.runInWorktree", runInWorktree],
    ["arborist.editConfig", editConfig],
    ["arborist.openWorktreeInNewWindow", openWorktreeInNewWindow],
    ["arborist.setupWorktree", runSetup],
    ["arborist.openDashboard", () => DashboardPanel.show()],
    [
      "arborist.refreshWorktrees",
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
  arb.disposeOutputChannel();
}
