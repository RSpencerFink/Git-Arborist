import * as vscode from "vscode";
import { arb, handleArboristError } from "../cli/gwRunner";
import type { WorktreeTreeItem } from "../providers/worktreeTreeItem";

export async function cleanWorktree(item?: WorktreeTreeItem): Promise<void> {
  try {
    let branch: string;

    if (item) {
      branch = item.worktree.branch;
    } else {
      const worktrees = await arb.ls();
      const pick = await vscode.window.showQuickPick(
        worktrees.map((wt) => ({ label: wt.branch, description: wt.path })),
        { placeHolder: "Select worktree to clean" },
      );
      if (!pick) return;
      branch = pick.label;
    }

    const confirm = await vscode.window.showWarningMessage(
      `This will discard all changes in "${branch}". Continue?`,
      { modal: true },
      "Clean",
    );

    if (confirm !== "Clean") return;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Cleaning ${branch}...`,
      },
      async () => {
        await arb.clean(branch);
        vscode.window.showInformationMessage(`Worktree ${branch} cleaned`);
      },
    );
  } catch (err) {
    await handleArboristError(err);
  }
}

export async function garbageCollect(): Promise<void> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Running garbage collection...",
      },
      async () => {
        await arb.gc();
        vscode.window.showInformationMessage("Garbage collection complete");
      },
    );
  } catch (err) {
    await handleArboristError(err);
  }
}

export async function cloneRepo(): Promise<void> {
  try {
    const repo = await vscode.window.showInputBox({
      prompt: "Repository URL",
      placeHolder: "https://github.com/user/repo.git",
    });

    if (!repo) return;

    const layout = await vscode.window.showQuickPick(
      [
        { label: "Standard Clone", value: "standard" },
        { label: "Bare Clone (worktree layout)", value: "bare" },
      ],
      { placeHolder: "Clone layout" },
    );

    if (!layout) return;

    const folder = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: "Clone Here",
    });

    if (!folder?.[0]) return;

    const flags = layout.value === "bare" ? ["--bare"] : [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Cloning ${repo}...`,
      },
      async () => {
        await arb.clone(repo, flags, { cwd: folder[0].fsPath });
        vscode.window.showInformationMessage("Repository cloned");
      },
    );
  } catch (err) {
    await handleArboristError(err);
  }
}

export async function initConfig(): Promise<void> {
  try {
    await arb.init();
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (workspaceRoot) {
      const configUri = vscode.Uri.joinPath(workspaceRoot, ".arborist.toml");
      const doc = await vscode.workspace.openTextDocument(configUri);
      await vscode.window.showTextDocument(doc);
    }
    vscode.window.showInformationMessage("Created .arborist.toml");
  } catch (err) {
    await handleArboristError(err);
  }
}

export async function runSetup(item?: WorktreeTreeItem): Promise<void> {
  try {
    let branch: string;

    if (item) {
      branch = item.worktree.branch;
    } else {
      const worktrees = await arb.ls();
      const pick = await vscode.window.showQuickPick(
        worktrees.map((wt) => ({ label: wt.branch, description: wt.path })),
        { placeHolder: "Select worktree to run setup on" },
      );
      if (!pick) return;
      branch = pick.label;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Running setup for ${branch}...`,
      },
      async () => {
        const output = await arb.setup(branch);
        if (output) {
          const channel = vscode.window.createOutputChannel("Git Arborist: Setup");
          channel.append(output);
          channel.show();
        }
        vscode.window.showInformationMessage(`Setup complete for ${branch}`);
      },
    );
  } catch (err) {
    await handleArboristError(err);
  }
}

export async function runInWorktree(): Promise<void> {
  try {
    const worktrees = await arb.ls();
    const pick = await vscode.window.showQuickPick(
      worktrees.map((wt) => ({
        label: wt.branch,
        description: wt.path,
        path: wt.path,
      })),
      { placeHolder: "Select worktree" },
    );

    if (!pick) return;

    const cmd = await vscode.window.showInputBox({
      prompt: "Command to run",
      placeHolder: "npm test",
    });

    if (!cmd) return;

    const terminal = vscode.window.createTerminal({
      name: `arb: ${pick.label}`,
      cwd: pick.path,
    });
    terminal.show();
    terminal.sendText(cmd);
  } catch (err) {
    await handleArboristError(err);
  }
}

export async function editConfig(): Promise<void> {
  try {
    const scope = await vscode.window.showQuickPick(
      [
        { label: "Project Config", value: "project" },
        { label: "Global Config", value: "global" },
      ],
      { placeHolder: "Which config to edit?" },
    );

    if (!scope) return;

    if (scope.value === "project") {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (workspaceRoot) {
        const configUri = vscode.Uri.joinPath(workspaceRoot, ".arborist.toml");
        try {
          const doc = await vscode.workspace.openTextDocument(configUri);
          await vscode.window.showTextDocument(doc);
        } catch {
          vscode.window.showWarningMessage(
            'No .arborist.toml found. Run "arb: Initialize Config" first.',
          );
        }
      }
    } else {
      const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
      const globalUri = vscode.Uri.file(`${homeDir}/.config/arborist/config.toml`);
      try {
        const doc = await vscode.workspace.openTextDocument(globalUri);
        await vscode.window.showTextDocument(doc);
      } catch {
        vscode.window.showWarningMessage(
          "No global arborist config found at ~/.config/arborist/config.toml",
        );
      }
    }
  } catch (err) {
    await handleArboristError(err);
  }
}
