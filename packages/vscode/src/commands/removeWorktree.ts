import * as vscode from "vscode";
import { gw, handleGwError } from "../cli/gwRunner";
import type { WorktreeTreeItem } from "../providers/worktreeTreeItem";

interface WorktreeIdentifier {
  name: string; // identifier to pass to gw rm (branch or path)
  displayName: string; // human-readable name for UI
}

function extractWorktree(item: unknown): WorktreeIdentifier | undefined {
  if (!item || typeof item !== "object") return undefined;

  const treeItem = item as WorktreeTreeItem;
  const worktree = treeItem.worktree;
  if (!worktree) {
    // Plain object fallback
    const plain = item as Record<string, unknown>;
    const branch = typeof plain.branch === "string" ? plain.branch : "";
    const path = typeof plain.path === "string" ? plain.path : "";
    const name = branch || path;
    if (!name) return undefined;
    return { name, displayName: branch || path };
  }

  const name = worktree.branch || worktree.path;
  if (!name) return undefined;
  return {
    name,
    displayName: worktree.branch || `(${worktree.head})`,
  };
}

export async function removeWorktree(item?: unknown): Promise<void> {
  try {
    let target: WorktreeIdentifier | undefined = extractWorktree(item);

    if (!target) {
      const worktrees = await gw.ls();
      const removable = worktrees.filter((wt) => !wt.isMain);

      if (removable.length === 0) {
        vscode.window.showInformationMessage("No worktrees to remove.");
        return;
      }

      const pick = await vscode.window.showQuickPick(
        removable.map((wt) => ({
          label: wt.branch || `(${wt.head})`,
          description: wt.path,
          name: wt.branch || wt.path,
        })),
        { placeHolder: "Select worktree to remove" },
      );

      if (!pick) return;
      target = { name: pick.name, displayName: pick.label };
    }

    const confirm = await vscode.window.showWarningMessage(
      `Remove worktree "${target.displayName}"?`,
      { modal: true, detail: "\"Remove Worktree\" deletes the working directory but keeps the branch. \"Remove Worktree + Branch\" also deletes the git branch." },
      "Remove Worktree",
      "Remove Worktree + Branch",
    );

    if (!confirm) return;

    const flags = ["--force"];
    if (confirm === "Remove Worktree + Branch") flags.push("--branch");

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Removing worktree ${target.displayName}...`,
      },
      async () => {
        const result = await gw.rm(target.name, flags);
        if (result.deleted_branch) {
          vscode.window.showInformationMessage(`Removed worktree and deleted branch ${result.deleted_branch}`);
        } else if (result.branch_delete_error) {
          vscode.window.showWarningMessage(`Removed worktree but failed to delete branch: ${result.branch_delete_error}`);
        } else {
          vscode.window.showInformationMessage(`Removed worktree at ${result.path}`);
        }
      },
    );
  } catch (err) {
    await handleGwError(err);
  }
}
