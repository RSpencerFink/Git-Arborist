import * as vscode from "vscode";
import { gw, handleGwError } from "../cli/gwRunner";

export async function addWorktree(): Promise<void> {
  try {
    const mode = await vscode.window.showQuickPick(
      [
        { label: "Existing Branch", value: "existing" },
        { label: "New Branch", value: "new" },
      ],
      { placeHolder: "Create worktree from..." },
    );

    if (!mode) return;

    const branch = await vscode.window.showInputBox({
      prompt: mode.value === "new" ? "New branch name" : "Existing branch name",
      placeHolder: "feature/my-feature",
    });

    if (!branch) return;

    const flags = mode.value === "new" ? ["-b"] : [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Creating worktree for ${branch}...`,
      },
      async () => {
        const result = await gw.add(branch, flags);

        const action = await vscode.window.showInformationMessage(
          `Worktree created at ${result.path}`,
          "Open in New Window",
          "Open in Current Window",
        );

        if (action === "Open in New Window") {
          await vscode.commands.executeCommand(
            "vscode.openFolder",
            vscode.Uri.file(result.path),
            {
              forceNewWindow: true,
            },
          );
        } else if (action === "Open in Current Window") {
          await vscode.commands.executeCommand(
            "vscode.openFolder",
            vscode.Uri.file(result.path),
          );
        }
      },
    );
  } catch (err) {
    await handleGwError(err);
  }
}
