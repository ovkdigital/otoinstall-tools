#!/usr/bin/env node
/**
 * OtoInstall CLI
 * Deploy projects from your terminal.
 *
 * Usage:
 *   otoinstall deploy [directory]     Deploy a project
 *   otoinstall deploy --zip file.zip  Deploy a ZIP file
 *   otoinstall status <id>            Check deploy status
 *   otoinstall logs <id>              View deploy logs
 *   otoinstall servers                List configured servers
 *   otoinstall projects               List recent deployments
 *   otoinstall login                  Configure API key
 *   otoinstall whoami                 Show account info
 */
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join, resolve, basename } from "path";
import { OtoInstallAPI } from "./api.js";
import { zipDirectory } from "./zip.js";
const CONFIG_DIR = join(homedir(), ".otoinstall");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
function loadConfig() {
    if (existsSync(CONFIG_FILE)) {
        return JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    }
    return { apiKey: "", baseUrl: "https://otoinstall.com" };
}
function saveConfig(config) {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function getApi() {
    const config = loadConfig();
    if (!config.apiKey) {
        console.log(chalk.red("\n  ❌ API key not configured. Run: otoinstall login\n"));
        process.exit(1);
    }
    return new OtoInstallAPI(config.apiKey, config.baseUrl);
}
// ─── Program ───
const program = new Command();
program
    .name("otoinstall")
    .description(chalk.bold("🚀 OtoInstall CLI — Deploy projects from your terminal"))
    .version("1.0.0");
// ────── LOGIN ──────
program
    .command("login")
    .description("Configure your API key")
    .option("-k, --key <key>", "API key")
    .option("-u, --url <url>", "Base URL (default: https://otoinstall.com)")
    .action(async (opts) => {
    let apiKey = opts.key;
    if (!apiKey) {
        const inquirer = await import("inquirer");
        const answers = await inquirer.default.prompt([
            {
                type: "password",
                name: "apiKey",
                message: "Enter your OtoInstall API key:",
                mask: "*",
                validate: (val) => val.startsWith("oi_") ? true : "Key must start with oi_",
            },
        ]);
        apiKey = answers.apiKey;
    }
    const config = loadConfig();
    config.apiKey = apiKey;
    if (opts.url) {
        config.baseUrl = opts.url;
    }
    saveConfig(config);
    console.log(chalk.green("\n  ✅ API key saved to ~/.otoinstall/config.json\n"));
    // Verify
    const spinner = ora("Verifying API key...").start();
    try {
        const api = new OtoInstallAPI(apiKey, config.baseUrl);
        const me = await api.me();
        spinner.succeed(`Authenticated as ${chalk.bold(me.user.name)} (${me.user.email})`);
    }
    catch (err) {
        spinner.fail(`Verification failed: ${err.message}`);
    }
});
// ────── DEPLOY ──────
program
    .command("deploy [directory]")
    .description("Deploy a project directory or ZIP file")
    .option("-z, --zip <file>", "Deploy a ZIP file instead")
    .option("-s, --server <id>", "Server credential ID")
    .option("-p, --path <path>", "Remote path on server")
    .option("-u, --url <url>", "Expected target URL")
    .option("-t, --type <type>", "Project type (auto, laravel, wordpress, react, etc.)")
    .action(async (directory, opts) => {
    const api = getApi();
    // Determine what to deploy
    let zipPath;
    if (opts.zip) {
        zipPath = resolve(opts.zip);
        if (!existsSync(zipPath)) {
            console.log(chalk.red(`\n  ❌ ZIP file not found: ${zipPath}\n`));
            process.exit(1);
        }
    }
    else {
        const dir = resolve(directory || ".");
        if (!existsSync(dir)) {
            console.log(chalk.red(`\n  ❌ Directory not found: ${dir}\n`));
            process.exit(1);
        }
        const spinner = ora(`Zipping ${chalk.cyan(basename(dir))}...`).start();
        try {
            zipPath = await zipDirectory(dir);
            spinner.succeed(`Zipped: ${basename(zipPath)}`);
        }
        catch (err) {
            spinner.fail(`ZIP failed: ${err.message}`);
            process.exit(1);
        }
    }
    // Get server
    let credentialId = opts.server ? parseInt(opts.server) : null;
    if (!credentialId) {
        const spinner = ora("Fetching servers...").start();
        try {
            const data = await api.listCredentials();
            const servers = data.data ?? [];
            spinner.stop();
            if (servers.length === 0) {
                console.log(chalk.yellow("\n  ⚠️  No servers configured. Add servers at otoinstall.com\n"));
                process.exit(1);
            }
            const inquirer = await import("inquirer");
            const answer = await inquirer.default.prompt([
                {
                    type: "list",
                    name: "server",
                    message: "Select target server:",
                    choices: servers.map((s) => ({
                        name: `${s.label} — ${s.protocol}://${s.host}:${s.port}`,
                        value: s.id,
                    })),
                },
            ]);
            credentialId = answer.server;
        }
        catch (err) {
            spinner.fail(`Failed to fetch servers: ${err.message}`);
            process.exit(1);
        }
    }
    // Deploy
    console.log();
    const deploySpinner = ora("Uploading to OtoInstall...").start();
    try {
        const result = await api.deploy(zipPath, {
            credential_id: credentialId,
            remote_path: opts.path,
            target_url: opts.url,
            project_type: opts.type ?? "auto",
        });
        deploySpinner.succeed(`Deploy started: ${chalk.bold(result.deploy_id)}`);
        // Poll status
        const statusSpinner = ora("Scanning...").start();
        let status = result.status;
        let attempts = 0;
        const emojis = {
            queued: "⏳", scanning: "🔍", detecting: "🔎",
            compatibility_check: "🧪", fixing: "🔧",
            local_testing: "🧪", deploying: "🚀",
            verifying: "✅", awaiting_user: "⏸️",
        };
        while (!["completed", "scan_failed", "fix_failed", "deploy_failed", "local_test_failed"].includes(status) && attempts < 120) {
            await sleep(1000);
            attempts++;
            try {
                const s = await api.getDeployStatus(result.deploy_id);
                status = s.status;
                statusSpinner.text = `${emojis[status] ?? "⏳"} ${status} (${s.progress}%)`;
            }
            catch { /* retry */ }
        }
        if (status === "completed") {
            statusSpinner.succeed(chalk.green("Deployment completed! 🎉"));
            console.log();
            console.log(chalk.dim("  Deploy ID:  ") + chalk.bold(result.deploy_id));
            if (result.links?.web) {
                console.log(chalk.dim("  Dashboard:  ") + chalk.blue(result.links.web));
            }
            console.log();
        }
        else {
            statusSpinner.fail(chalk.red(`Deployment ${status}`));
            console.log(chalk.dim(`  Run: otoinstall logs ${result.deploy_id}`));
        }
    }
    catch (err) {
        deploySpinner.fail(`Deploy failed: ${err.message}`);
        process.exit(1);
    }
});
// ────── STATUS ──────
program
    .command("status <deploy-id>")
    .description("Check deployment status")
    .action(async (deployId) => {
    const api = getApi();
    const spinner = ora("Checking status...").start();
    try {
        const s = await api.getDeployStatus(deployId);
        spinner.stop();
        console.log();
        console.log(chalk.bold("  📊 Deployment Status"));
        console.log(chalk.dim("  ─────────────────────"));
        console.log(`  ID:       ${chalk.bold(s.deploy_id)}`);
        console.log(`  Status:   ${s.status}`);
        console.log(`  Progress: ${s.progress}%`);
        if (s.project_type) {
            console.log(`  Type:     ${s.project_type}`);
        }
        if (s.target_url) {
            console.log(`  URL:      ${chalk.blue(s.target_url)}`);
        }
        if (s.security_score != null) {
            console.log(`  Security: ${s.security_score}/100`);
        }
        console.log();
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
// ────── LOGS ──────
program
    .command("logs <deploy-id>")
    .description("View deployment logs")
    .action(async (deployId) => {
    const api = getApi();
    const spinner = ora("Fetching logs...").start();
    try {
        const data = await api.getDeployLogs(deployId);
        spinner.stop();
        const logs = data.logs ?? [];
        if (logs.length === 0) {
            console.log(chalk.dim("\n  No logs yet.\n"));
            return;
        }
        console.log();
        console.log(chalk.bold(`  📋 Logs for ${deployId}`));
        console.log(chalk.dim("  ─────────────────────"));
        for (const log of logs) {
            const color = log.level === "error" ? chalk.red : log.level === "warning" ? chalk.yellow : log.level === "success" ? chalk.green : chalk.dim;
            console.log(`  ${color(`[${log.level}]`)} ${chalk.dim(log.time)} ${log.message}`);
        }
        console.log();
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
// ────── SERVERS ──────
program
    .command("servers")
    .description("List configured servers")
    .action(async () => {
    const api = getApi();
    const spinner = ora("Fetching servers...").start();
    try {
        const data = await api.listCredentials();
        spinner.stop();
        const servers = data.data ?? [];
        if (servers.length === 0) {
            console.log(chalk.dim("\n  No servers configured.\n"));
            return;
        }
        console.log();
        console.log(chalk.bold("  🖥️  Your Servers"));
        console.log(chalk.dim("  ─────────────────────"));
        for (const s of servers) {
            console.log(`  ${chalk.yellow(`[${s.id}]`)} ${chalk.bold(s.label)} — ${s.protocol}://${s.host}:${s.port}`);
        }
        console.log();
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
// ────── PROJECTS ──────
program
    .command("projects")
    .description("List recent deployments")
    .action(async () => {
    const api = getApi();
    const spinner = ora("Fetching projects...").start();
    try {
        const data = await api.listProjects();
        spinner.stop();
        const projects = data.data ?? [];
        if (projects.length === 0) {
            console.log(chalk.dim("\n  No deployments yet.\n"));
            return;
        }
        console.log();
        console.log(chalk.bold("  📂 Recent Deployments"));
        console.log(chalk.dim("  ─────────────────────"));
        for (const p of projects) {
            const statusColor = p.status === "completed" ? chalk.green : p.status.includes("failed") ? chalk.red : chalk.yellow;
            console.log(`  ${chalk.bold(p.filename)} — ${statusColor(p.status)} (${p.progress}%) — ${chalk.dim(p.created_at)}`);
        }
        console.log();
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
// ────── WHOAMI ──────
program
    .command("whoami")
    .description("Show account info")
    .action(async () => {
    const api = getApi();
    const spinner = ora("Checking...").start();
    try {
        const data = await api.me();
        spinner.stop();
        console.log();
        console.log(chalk.bold("  👤 Account Info"));
        console.log(chalk.dim("  ─────────────────────"));
        console.log(`  Name:    ${chalk.bold(data.user.name)}`);
        console.log(`  Email:   ${data.user.email}`);
        console.log(`  Key:     ${data.api_key.prefix}`);
        console.log(`  Scopes:  ${data.api_key.scopes.join(", ")}`);
        console.log();
    }
    catch (err) {
        spinner.fail(err.message);
    }
});
program.parse();
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=index.js.map