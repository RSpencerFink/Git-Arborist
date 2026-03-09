import * as vscode from "vscode";
import { gw, handleGwError } from "../cli/gwRunner";
import type { PluginItem } from "../cli/types";

class PluginTreeItem extends vscode.TreeItem {
  constructor(plugin: PluginItem) {
    super(plugin.name, vscode.TreeItemCollapsibleState.None);
    this.description = plugin.enabled ? "enabled" : "disabled";
    this.iconPath = new vscode.ThemeIcon(
      plugin.enabled ? "check" : "circle-outline",
      plugin.enabled
        ? new vscode.ThemeColor("charts.green")
        : new vscode.ThemeColor("disabledForeground"),
    );
    this.contextValue = "plugin";
  }
}

export class PluginTreeProvider implements vscode.TreeDataProvider<PluginTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    PluginTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: PluginTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<PluginTreeItem[]> {
    try {
      const plugins = await gw.pluginList();
      return plugins.map((p) => new PluginTreeItem(p));
    } catch (err) {
      await handleGwError(err);
      return [];
    }
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
