import * as vscode from "vscode";
import { gw, handleGwError } from "../cli/gwRunner";
import type { WorktreeTreeItem } from "../providers/worktreeTreeItem";

export async function switchWorktree(item?: WorktreeTreeItem): Promise<void> {
  try {
    let targetPath: string;

    if (item) {
      targetPath = item.worktree.path;
    } else {
      const worktrees = await gw.ls();
      const pick = await vscode.window.showQuickPick(
        worktrees.map((wt) => ({
          label: wt.branch,
          description: [
            wt.isMain ? "[main]" : "",
            wt.isCurrent ? "(current)" : "",
            wt.status?.dirty ? "modified" : "",
          ]
            .filter(Boolean)
            .join(" "),
          detail: wt.path,
          path: wt.path,
        })),
        { placeHolder: "Select worktree to switch to" },
      );

      if (!pick) return;
      targetPath = pick.path;
    }

    const behavior = vscode.workspace
      .getConfiguration("gw")
      .get<string>("switchBehavior", "newWindow");

    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(targetPath),
      { forceNewWindow: behavior === "newWindow" },
    );
  } catch (err) {
    await handleGwError(err);
  }
}

export async function switchToMain(): Promise<void> {
  try {
    const worktrees = await gw.ls();
    const mainWt = worktrees.find((wt) => wt.isMain);

    if (!mainWt) {
      vscode.window.showErrorMessage("Could not find main worktree");
      return;
    }

    const behavior = vscode.workspace
      .getConfiguration("gw")
      .get<string>("switchBehavior", "newWindow");

    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(mainWt.path),
      { forceNewWindow: behavior === "newWindow" },
    );
  } catch (err) {
    await handleGwError(err);
  }
}

export async function openWorktreeInNewWindow(
  item?: WorktreeTreeItem,
): Promise<void> {
  if (!item) return;
  await vscode.commands.executeCommand(
    "vscode.openFolder",
    vscode.Uri.file(item.worktree.path),
    { forceNewWindow: true },
  );
}
