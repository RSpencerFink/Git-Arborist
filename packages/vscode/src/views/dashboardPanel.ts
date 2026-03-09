import * as vscode from "vscode";
import { arb, handleArboristError } from "../cli/gwRunner";
import type { DashWorktree } from "../cli/types";

export class DashboardPanel {
  private static instance: DashboardPanel | undefined;
  private panel: vscode.WebviewPanel;
  private refreshTimer: ReturnType<typeof setInterval> | undefined;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (msg) => {
        if (msg.type === "switch") {
          const behavior = vscode.workspace
            .getConfiguration("arborist")
            .get<string>("switchBehavior", "newWindow");
          await vscode.commands.executeCommand(
            "vscode.openFolder",
            vscode.Uri.file(msg.path),
            { forceNewWindow: behavior === "newWindow" },
          );
        } else if (msg.type === "refresh") {
          await this.refresh();
        }
      },
      null,
      this.disposables,
    );

    this.refresh();
    this.startAutoRefresh();
  }

  static show(): void {
    if (DashboardPanel.instance) {
      DashboardPanel.instance.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "arborist.dashboard",
      "Git Arborist Dashboard",
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true },
    );

    panel.webview.html = getDashboardHtml();
    DashboardPanel.instance = new DashboardPanel(panel);
  }

  private async refresh(): Promise<void> {
    try {
      const data = await arb.dash();
      this.panel.webview.postMessage({ type: "data", worktrees: data });
    } catch (err) {
      await handleArboristError(err);
    }
  }

  private startAutoRefresh(): void {
    const interval = vscode.workspace
      .getConfiguration("arborist")
      .get<number>("dashboardRefreshInterval", 5000);
    this.refreshTimer = setInterval(() => this.refresh(), interval);
  }

  private dispose(): void {
    DashboardPanel.instance = undefined;
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    for (const d of this.disposables) d.dispose();
    this.panel.dispose();
  }
}

export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git Arborist Dashboard</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px;
      margin: 0;
    }
    h1 {
      font-size: 1.2em;
      margin: 0 0 8px 0;
      color: var(--vscode-foreground);
    }
    .meta {
      color: var(--vscode-descriptionForeground);
      font-size: 0.85em;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 6px 12px;
      border-bottom: 1px solid var(--vscode-widget-border);
      color: var(--vscode-descriptionForeground);
      font-weight: 600;
      font-size: 0.85em;
    }
    td {
      padding: 6px 12px;
      border-bottom: 1px solid var(--vscode-widget-border, transparent);
    }
    tr.selected {
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }
    tr:hover {
      background: var(--vscode-list-hoverBackground);
    }
    tr.current td:first-child {
      position: relative;
    }
    tr.current td:first-child::before {
      content: "\\25cf";
      color: var(--vscode-charts-green);
      position: absolute;
      left: 2px;
    }
    .dirty { color: var(--vscode-charts-yellow); }
    .clean { color: var(--vscode-charts-green); }
    .behind { color: var(--vscode-charts-yellow); }
    .ahead { color: var(--vscode-charts-green); }
    .pr-open { color: var(--vscode-charts-green); }
    .pr-merged { color: var(--vscode-charts-purple); }
    .ci-success { color: var(--vscode-charts-green); }
    .ci-failure { color: var(--vscode-charts-red); }
    .ci-pending { color: var(--vscode-charts-yellow); }
    .path { color: var(--vscode-descriptionForeground); font-size: 0.85em; }
    .footer {
      margin-top: 12px;
      color: var(--vscode-descriptionForeground);
      font-size: 0.85em;
    }
    kbd {
      background: var(--vscode-keybindingLabel-background);
      border: 1px solid var(--vscode-keybindingLabel-border);
      border-radius: 3px;
      padding: 1px 4px;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <h1>Git Arborist</h1>
  <div class="meta" id="meta"></div>
  <table>
    <thead>
      <tr>
        <th></th>
        <th>Branch</th>
        <th>Head</th>
        <th>Changes</th>
        <th>Remote</th>
        <th id="pr-header" style="display:none">PR</th>
        <th id="graphite-header" style="display:none">Stack</th>
        <th>Path</th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
  <div class="footer">
    <kbd>j</kbd>/<kbd>k</kbd> navigate &nbsp;
    <kbd>Enter</kbd> switch &nbsp;
    <kbd>r</kbd> refresh
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    let worktrees = [];
    let selectedIndex = 0;

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'data') {
        worktrees = msg.worktrees;
        render();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'j' || e.key === 'ArrowDown') {
        selectedIndex = Math.min(worktrees.length - 1, selectedIndex + 1);
        render();
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (e.key === 'Enter' && worktrees[selectedIndex]) {
        vscode.postMessage({ type: 'switch', path: worktrees[selectedIndex].path });
      } else if (e.key === 'r') {
        vscode.postMessage({ type: 'refresh' });
      }
    });

    function render() {
      const hasPr = worktrees.some(w => w.pr);
      const hasGraphite = worktrees.some(w => w.graphite);

      document.getElementById('pr-header').style.display = hasPr ? '' : 'none';
      document.getElementById('graphite-header').style.display = hasGraphite ? '' : 'none';

      document.getElementById('meta').textContent =
        worktrees.length + ' worktree' + (worktrees.length !== 1 ? 's' : '') +
        ' | refreshed ' + new Date().toLocaleTimeString();

      const tbody = document.getElementById('tbody');
      tbody.innerHTML = '';

      worktrees.forEach((wt, i) => {
        const tr = document.createElement('tr');
        if (i === selectedIndex) tr.classList.add('selected');
        if (wt.isCurrent) tr.classList.add('current');
        tr.onclick = () => {
          selectedIndex = i;
          render();
        };
        tr.ondblclick = () => {
          vscode.postMessage({ type: 'switch', path: wt.path });
        };

        // Marker
        tr.innerHTML += '<td style="width:20px"></td>';

        // Branch
        const mainTag = wt.isMain ? ' <span style="opacity:0.5">[main]</span>' : '';
        tr.innerHTML += '<td>' + esc(wt.branch) + mainTag + '</td>';

        // Head
        tr.innerHTML += '<td style="opacity:0.5">' + esc(wt.head) + '</td>';

        // Changes
        let changes = '';
        if (wt.status) {
          if (wt.status.dirty) {
            const parts = [];
            if (wt.status.staged > 0) parts.push('+' + wt.status.staged);
            if (wt.status.modified > 0) parts.push('~' + wt.status.modified);
            if (wt.status.untracked > 0) parts.push('?' + wt.status.untracked);
            changes = '<span class="dirty">' + parts.join(' ') + '</span>';
          } else {
            changes = '<span class="clean">clean</span>';
          }
        }
        tr.innerHTML += '<td>' + changes + '</td>';

        // Remote
        let remote = '';
        if (wt.status) {
          const parts = [];
          if (wt.status.ahead > 0) parts.push('<span class="ahead">\u2191' + wt.status.ahead + '</span>');
          if (wt.status.behind > 0) parts.push('<span class="behind">\u2193' + wt.status.behind + '</span>');
          remote = parts.length > 0 ? parts.join(' ') : '<span class="clean">up to date</span>';
        }
        tr.innerHTML += '<td>' + remote + '</td>';

        // PR
        if (hasPr) {
          let pr = '';
          if (wt.pr) {
            const cls = wt.pr.state === 'MERGED' ? 'pr-merged' : 'pr-open';
            pr = '<span class="' + cls + '">#' + wt.pr.number + '</span>';
            if (wt.pr.ciStatus) {
              pr += ' <span class="ci-' + wt.pr.ciStatus.toLowerCase() + '">' + wt.pr.ciStatus + '</span>';
            }
          }
          tr.innerHTML += '<td>' + pr + '</td>';
        }

        // Graphite
        if (hasGraphite) {
          let stack = '';
          if (wt.graphite) {
            stack = wt.graphite.position || wt.graphite.stack || '';
          }
          tr.innerHTML += '<td>' + esc(stack) + '</td>';
        }

        // Path
        tr.innerHTML += '<td class="path">' + esc(wt.path) + '</td>';

        tbody.appendChild(tr);
      });
    }

    function esc(s) {
      const d = document.createElement('div');
      d.textContent = s || '';
      return d.innerHTML;
    }
  </script>
</body>
</html>`;
}
