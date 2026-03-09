import * as vscode from "vscode";

export class FileWatcher {
  private watchers: vscode.FileSystemWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private onChangeCallback: (() => void) | undefined;

  constructor(private debounceMs = 100) {}

  watch(callback: () => void): void {
    this.onChangeCallback = callback;

    const patterns = [
      "**/.arborist.toml",
      "**/.git/worktrees/**",
      "**/.git/refs/heads/**",
    ];

    for (const pattern of patterns) {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      watcher.onDidChange(() => this.debouncedFire());
      watcher.onDidCreate(() => this.debouncedFire());
      watcher.onDidDelete(() => this.debouncedFire());
      this.watchers.push(watcher);
    }
  }

  private debouncedFire(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.onChangeCallback?.();
    }, this.debounceMs);
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const w of this.watchers) w.dispose();
    this.watchers = [];
  }
}
