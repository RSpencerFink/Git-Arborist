import * as vscode from "vscode";
import { gw, handleGwError } from "../cli/gwRunner";

export async function pruneWorktrees(): Promise<void> {
  try {
    const dryRun = await gw.pruneDryRun();

    if (!dryRun.candidates || dryRun.candidates.length === 0) {
      vscode.window.showInformationMessage(
        "Nothing to prune. All worktrees are active.",
      );
      return;
    }

    const selected = await vscode.window.showQuickPick(
      dryRun.candidates.map((c) => ({
        label: c.branch,
        description: c.reason,
        detail: c.path,
        picked: true,
      })),
      {
        placeHolder: "Select worktrees to prune",
        canPickMany: true,
      },
    );

    if (!selected || selected.length === 0) return;

    const confirm = await vscode.window.showWarningMessage(
      `Remove ${selected.length} worktree${selected.length > 1 ? "s" : ""}?`,
      { modal: true },
      "Prune",
    );

    if (confirm !== "Prune") return;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Pruning worktrees...",
      },
      async () => {
        const result = await gw.prune();
        const removed = result.removed?.length ?? 0;
        const failed = result.failed?.length ?? 0;
        let msg = `Pruned ${removed} worktree${removed !== 1 ? "s" : ""}`;
        if (failed > 0) msg += ` (${failed} failed)`;
        vscode.window.showInformationMessage(msg);
      },
    );
  } catch (err) {
    await handleGwError(err);
  }
}
