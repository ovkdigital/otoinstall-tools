import * as vscode from "vscode";
import { OtoInstallAPI } from "./api";
import { zipDirectory } from "./zip";
import { basename } from "path";

interface ServerPickItem extends vscode.QuickPickItem {
  id: number;
}

let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("OtoInstall");

  // Status bar button
  const showBar = vscode.workspace.getConfiguration("otoinstall").get("showStatusBar", true);
  if (showBar) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(cloud-upload) Deploy";
    statusBarItem.tooltip = "OtoInstall — Deploy Project";
    statusBarItem.command = "otoinstall.deploy";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("otoinstall.deploy", () => deployProject()),
    vscode.commands.registerCommand("otoinstall.deployZip", (uri?: vscode.Uri) => deployZip(uri)),
    vscode.commands.registerCommand("otoinstall.checkStatus", () => checkStatus()),
    vscode.commands.registerCommand("otoinstall.viewLogs", () => viewLogs()),
    vscode.commands.registerCommand("otoinstall.listServers", () => listServers()),
    vscode.commands.registerCommand("otoinstall.listProjects", () => listProjects()),
    vscode.commands.registerCommand("otoinstall.setApiKey", () => setApiKey()),
  );

  log("✅ OtoInstall extension activated");
}

export function deactivate() {
  outputChannel?.dispose();
}

// ─── Helpers ───

function getApi(): OtoInstallAPI | null {
  const config = vscode.workspace.getConfiguration("otoinstall");
  const apiKey = config.get<string>("apiKey", "");
  const baseUrl = config.get<string>("baseUrl", "https://otoinstall.com");

  if (!apiKey) {
    vscode.window.showWarningMessage(
      "OtoInstall: API key not configured.",
      "Set API Key"
    ).then((choice) => {
      if (choice === "Set API Key") { setApiKey(); }
    });
    return null;
  }

  return new OtoInstallAPI(apiKey, baseUrl);
}

function log(msg: string) {
  const ts = new Date().toLocaleTimeString();
  outputChannel.appendLine(`[${ts}] ${msg}`);
}

// ─── Commands ───

async function setApiKey() {
  const key = await vscode.window.showInputBox({
    prompt: "Enter your OtoInstall API key",
    placeHolder: "oi_live_sk7xKm9pQ2vR4tY8...",
    password: true,
    ignoreFocusOut: true,
    validateInput: (val) => {
      if (!val.startsWith("oi_")) { return "API key must start with oi_live_ or oi_test_"; }
      if (val.length < 20) { return "API key is too short"; }
      return null;
    },
  });

  if (key) {
    await vscode.workspace.getConfiguration("otoinstall").update("apiKey", key, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage("✅ OtoInstall API key saved!");
    log("API key configured");
  }
}

async function deployProject() {
  const api = getApi();
  if (!api) { return; }

  // Get workspace folder
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  let targetFolder: vscode.WorkspaceFolder;
  if (folders.length === 1) {
    targetFolder = folders[0];
  } else {
    const picked = await vscode.window.showWorkspaceFolderPick({ placeHolder: "Select project to deploy" });
    if (!picked) { return; }
    targetFolder = picked;
  }

  // Get servers
  log("Fetching server list...");
  let servers: any[];
  try {
    const data = await api.listCredentials();
    servers = data.data ?? [];
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed to fetch servers: ${err.message}`);
    return;
  }

  if (servers.length === 0) {
    vscode.window.showWarningMessage("No servers configured. Add servers at otoinstall.com/credentials");
    return;
  }

  // Pick server
  const serverItems: ServerPickItem[] = servers.map((s: any) => ({
    label: `${s.label}`,
    description: `${s.protocol}://${s.host}:${s.port}`,
    detail: `ID: ${s.id} · ${s.remote_path ?? "/"}`,
    id: s.id,
  }));

  const picked = await vscode.window.showQuickPick(serverItems, {
    placeHolder: "Select target server",
    title: "🖥️ OtoInstall — Choose Server",
  });
  if (!picked) { return; }

  // Confirm deploy
  const confirm = await vscode.window.showInformationMessage(
    `Deploy "${basename(targetFolder.uri.fsPath)}" to ${picked.label}?`,
    { modal: true },
    "🚀 Deploy"
  );
  if (confirm !== "🚀 Deploy") { return; }

  // Start deployment
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "OtoInstall",
      cancellable: false,
    },
    async (progress) => {
      try {
        // Step 1: ZIP
        progress.report({ message: "📦 Zipping project...", increment: 10 });
        log(`Zipping ${targetFolder.uri.fsPath}...`);
        const zipPath = await zipDirectory(targetFolder.uri.fsPath);
        log(`ZIP created: ${zipPath}`);

        // Step 2: Upload
        progress.report({ message: "☁️ Uploading to OtoInstall...", increment: 30 });
        log(`Uploading to server ${picked.id}...`);
        const result = await api.deploy(zipPath, { credential_id: picked.id });
        log(`Deploy started: ${result.deploy_id}`);

        // Step 3: Poll status
        progress.report({ message: "🔍 Security scanning...", increment: 20 });
        let status = result.status;
        let attempts = 0;
        const maxAttempts = 120; // 2 minutes

        while (!["completed", "scan_failed", "fix_failed", "deploy_failed", "local_test_failed"].includes(status) && attempts < maxAttempts) {
          await sleep(1000);
          attempts++;

          try {
            const statusData = await api.getDeployStatus(result.deploy_id);
            status = statusData.status;

            const emoji: Record<string, string> = {
              scanning: "🔍", detecting: "🔎", compatibility_check: "🧪",
              fixing: "🔧", local_testing: "🧪", deploying: "🚀",
              verifying: "✅", awaiting_user: "⏸️",
            };

            progress.report({
              message: `${emoji[status] ?? "⏳"} ${status} (${statusData.progress}%)`,
              increment: 1,
            });
            log(`Status: ${status} (${statusData.progress}%)`);
          } catch { /* retry */ }
        }

        // Result
        if (status === "completed") {
          const action = await vscode.window.showInformationMessage(
            `🎉 Deployed successfully!`,
            "View Dashboard", "View Logs"
          );
          if (action === "View Dashboard") {
            vscode.env.openExternal(vscode.Uri.parse(result.links?.web ?? "https://otoinstall.com"));
          } else if (action === "View Logs") {
            outputChannel.show();
          }
          log("✅ Deployment completed!");
          if (statusBarItem) {
            statusBarItem.text = "$(check) Deployed";
            setTimeout(() => { statusBarItem.text = "$(cloud-upload) Deploy"; }, 5000);
          }
        } else {
          vscode.window.showErrorMessage(`Deploy ${status}. Check logs for details.`);
          outputChannel.show();
          log(`❌ Deployment ended with status: ${status}`);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Deploy failed: ${err.message}`);
        log(`❌ Error: ${err.message}`);
      }
    }
  );
}

async function deployZip(uri?: vscode.Uri) {
  const api = getApi();
  if (!api) { return; }

  let zipPath: string;
  if (uri) {
    zipPath = uri.fsPath;
  } else {
    const files = await vscode.window.showOpenDialog({
      filters: { "ZIP files": ["zip"] },
      canSelectMany: false,
    });
    if (!files || files.length === 0) { return; }
    zipPath = files[0].fsPath;
  }

  // Get servers + pick
  const data = await api.listCredentials();
  const servers = data.data ?? [];
  if (servers.length === 0) {
    vscode.window.showWarningMessage("No servers configured.");
    return;
  }

  const pickItems: ServerPickItem[] = servers.map((s: any) => ({ label: s.label, description: `${s.protocol}://${s.host}`, id: s.id }));
  const picked = await vscode.window.showQuickPick(pickItems, { placeHolder: "Select target server" });
  if (!picked) { return; }

  try {
    const result = await api.deploy(zipPath, { credential_id: picked.id });
    vscode.window.showInformationMessage(`🚀 Deploy started! ID: ${result.deploy_id}`);
    log(`Deploy started from ZIP: ${result.deploy_id}`);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Deploy failed: ${err.message}`);
  }
}

async function checkStatus() {
  const api = getApi();
  if (!api) { return; }

  const deployId = await vscode.window.showInputBox({
    prompt: "Enter deployment ID",
    placeHolder: "01HYJ3R8KQFG...",
  });
  if (!deployId) { return; }

  try {
    const status = await api.getDeployStatus(deployId);
    const msg = `📊 ${status.status} (${status.progress}%)${status.target_url ? ` — ${status.target_url}` : ""}`;
    vscode.window.showInformationMessage(msg);
    log(msg);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed: ${err.message}`);
  }
}

async function viewLogs() {
  const api = getApi();
  if (!api) { return; }

  const deployId = await vscode.window.showInputBox({
    prompt: "Enter deployment ID",
    placeHolder: "01HYJ3R8KQFG...",
  });
  if (!deployId) { return; }

  try {
    const data = await api.getDeployLogs(deployId);
    outputChannel.clear();
    outputChannel.appendLine(`📋 Deploy Logs: ${deployId}\n`);
    for (const log of data.logs ?? []) {
      outputChannel.appendLine(`[${log.level}] ${log.time} — ${log.message}`);
    }
    outputChannel.show();
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed: ${err.message}`);
  }
}

async function listServers() {
  const api = getApi();
  if (!api) { return; }

  try {
    const data = await api.listCredentials();
    const servers = data.data ?? [];

    if (servers.length === 0) {
      vscode.window.showInformationMessage("No servers configured.");
      return;
    }

    outputChannel.clear();
    outputChannel.appendLine("🖥️ Your Servers:\n");
    for (const s of servers) {
      outputChannel.appendLine(`  [ID: ${s.id}] ${s.label} — ${s.protocol}://${s.host}:${s.port}${s.remote_path ?? ""}`);
    }
    outputChannel.show();
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed: ${err.message}`);
  }
}

async function listProjects() {
  const api = getApi();
  if (!api) { return; }

  try {
    const data = await api.listProjects();
    const projects = data.data ?? [];

    if (projects.length === 0) {
      vscode.window.showInformationMessage("No deployments yet.");
      return;
    }

    outputChannel.clear();
    outputChannel.appendLine("📂 Your Deployments:\n");
    for (const p of projects) {
      outputChannel.appendLine(`  ${p.filename} — ${p.status} (${p.progress}%) — ${p.created_at}`);
    }
    outputChannel.show();
  } catch (err: any) {
    vscode.window.showErrorMessage(`Failed: ${err.message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
