#!/usr/bin/env node

/**
 * OtoInstall MCP Server
 * 
 * Deploy projects directly from any MCP-compatible AI tool:
 * Claude Desktop, Cursor, Windsurf, Cline, Continue, Zed, and more.
 * 
 * Setup: Set OTOINSTALL_API_KEY and optionally OTOINSTALL_BASE_URL env vars.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OtoInstallClient } from "./api-client.js";
import { zipDirectory } from "./zip-utils.js";
import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";

// ─── Configuration ───
const API_KEY = process.env.OTOINSTALL_API_KEY ?? "";
const BASE_URL = process.env.OTOINSTALL_BASE_URL ?? "https://otoinstall.com";

if (!API_KEY) {
  console.error("❌ OTOINSTALL_API_KEY environment variable is required.");
  console.error("   Get your key at: https://otoinstall.com/account/api-keys");
  process.exit(1);
}

const client = new OtoInstallClient(API_KEY, BASE_URL);

// ─── MCP Server ───
const server = new McpServer({
  name: "otoinstall",
  version: "1.0.0",
});

// ════════════════════════════════════════════════════════════════
// TOOL 1: deploy_project
// ════════════════════════════════════════════════════════════════
server.tool(
  "deploy_project",
  "Deploy a project to a live server. Zips the specified directory and uploads it to OtoInstall for automated security scanning, auto-fixing, and deployment via FTP/SFTP/SSH.",
  {
    directory: z.string().describe("Absolute path to the project directory to deploy"),
    credential_id: z.number().describe("Server credential ID to deploy to (use list_servers to find IDs)"),
    remote_path: z.string().optional().describe("Remote path on the server (optional, uses credential default)"),
    target_url: z.string().optional().describe("Expected URL of the deployed site (optional)"),
    project_type: z.enum(["auto", "laravel", "wordpress", "react", "vue", "nextjs", "html", "php"]).optional().describe("Project type hint (default: auto-detect)"),
  },
  async ({ directory, credential_id, remote_path, target_url, project_type }) => {
    try {
      // Validate directory exists
      const absDir = resolve(directory);
      if (!existsSync(absDir)) {
        return { content: [{ type: "text", text: `❌ Directory not found: ${absDir}` }] };
      }

      // Zip the directory
      const zipPath = await zipDirectory(absDir);
      const zipName = `${basename(absDir)}.zip`;

      // Deploy via API
      const result = await client.deploy(zipPath, {
        credential_id,
        remote_path,
        target_url,
        project_type: project_type ?? "auto",
      });

      // Clean up temp zip
      try { (await import("fs")).unlinkSync(zipPath); } catch {}

      return {
        content: [{
          type: "text",
          text: [
            `✅ Deployment started!`,
            ``,
            `📦 Deploy ID: ${result.deploy_id}`,
            `📊 Status: ${result.status}`,
            `🔗 Status URL: ${result.links?.status ?? "N/A"}`,
            `🌐 Web Dashboard: ${result.links?.web ?? "N/A"}`,
            ``,
            `Use check_deploy_status with deploy_id "${result.deploy_id}" to monitor progress.`,
          ].join("\n"),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Deploy failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ════════════════════════════════════════════════════════════════
// TOOL 2: deploy_zip
// ════════════════════════════════════════════════════════════════
server.tool(
  "deploy_zip",
  "Deploy an existing ZIP file to a live server via OtoInstall. Use this when you already have a ZIP file ready.",
  {
    zip_path: z.string().describe("Absolute path to the ZIP file to deploy"),
    credential_id: z.number().describe("Server credential ID to deploy to"),
    remote_path: z.string().optional().describe("Remote path on the server"),
    target_url: z.string().optional().describe("Expected URL of the deployed site"),
    project_type: z.enum(["auto", "laravel", "wordpress", "react", "vue", "nextjs", "html", "php"]).optional().describe("Project type hint"),
  },
  async ({ zip_path, credential_id, remote_path, target_url, project_type }) => {
    try {
      const absPath = resolve(zip_path);
      if (!existsSync(absPath)) {
        return { content: [{ type: "text", text: `❌ ZIP file not found: ${absPath}` }] };
      }

      const result = await client.deploy(absPath, {
        credential_id,
        remote_path,
        target_url,
        project_type: project_type ?? "auto",
      });

      return {
        content: [{
          type: "text",
          text: [
            `✅ Deployment started from ZIP!`,
            ``,
            `📦 Deploy ID: ${result.deploy_id}`,
            `📊 Status: ${result.status}`,
            `🔗 Track: ${result.links?.status ?? "N/A"}`,
          ].join("\n"),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Deploy failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ════════════════════════════════════════════════════════════════
// TOOL 3: check_deploy_status
// ════════════════════════════════════════════════════════════════
server.tool(
  "check_deploy_status",
  "Check the current status of a deployment. Returns progress percentage, current phase, and any errors.",
  {
    deploy_id: z.string().describe("The deployment ULID returned from deploy_project or deploy_zip"),
  },
  async ({ deploy_id }) => {
    try {
      const status = await client.getDeployStatus(deploy_id);

      const statusEmoji: Record<string, string> = {
        queued: "⏳", scanning: "🔍", detecting: "🔎",
        compatibility_check: "🧪", fixing: "🔧",
        local_testing: "🧪", deploying: "🚀",
        verifying: "✅", completed: "🎉",
        scan_failed: "❌", fix_failed: "❌",
        deploy_failed: "❌", local_test_failed: "❌",
        awaiting_user: "⏸️",
      };

      const emoji = statusEmoji[status.status] ?? "📊";

      let text = [
        `${emoji} Deployment Status`,
        ``,
        `📦 Deploy ID: ${status.deploy_id}`,
        `📊 Status: ${status.status}`,
        `📈 Progress: ${status.progress}%`,
      ];

      if (status.project_type) text.push(`📁 Type: ${status.project_type}`);
      if (status.target_url) text.push(`🌐 URL: ${status.target_url}`);
      if (status.security_score !== null && status.security_score !== undefined) {
        text.push(`🛡️ Security Score: ${status.security_score}/100`);
      }
      if (status.started_at) text.push(`⏱️ Started: ${status.started_at}`);
      if (status.completed_at) text.push(`✅ Completed: ${status.completed_at}`);
      if (status.error) text.push(`\n❌ Error: ${status.error}`);

      return { content: [{ type: "text", text: text.join("\n") }] };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Failed to check status: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ════════════════════════════════════════════════════════════════
// TOOL 4: get_deploy_logs
// ════════════════════════════════════════════════════════════════
server.tool(
  "get_deploy_logs",
  "Retrieve the detailed deployment logs for a specific deployment.",
  {
    deploy_id: z.string().describe("The deployment ULID"),
  },
  async ({ deploy_id }) => {
    try {
      const data = await client.getDeployLogs(deploy_id);
      
      if (!data.logs || data.logs.length === 0) {
        return { content: [{ type: "text", text: `📋 No logs yet for deployment ${deploy_id}.` }] };
      }

      const logText = data.logs.map((log: any) => {
        const levelEmoji: Record<string, string> = {
          info: "ℹ️", warning: "⚠️", error: "❌", success: "✅", debug: "🔍"
        };
        return `${levelEmoji[log.level] ?? "•"} [${log.time}] ${log.message}`;
      }).join("\n");

      return {
        content: [{ type: "text", text: `📋 Deployment Logs (${deploy_id}):\n\n${logText}` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Failed to get logs: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ════════════════════════════════════════════════════════════════
// TOOL 5: list_projects
// ════════════════════════════════════════════════════════════════
server.tool(
  "list_projects",
  "List all deployments (projects) for the current user. Shows status, progress, and URLs.",
  {
    status: z.string().optional().describe("Filter by status: queued, scanning, deploying, completed, etc."),
    per_page: z.number().optional().describe("Results per page (default: 10)"),
  },
  async ({ status, per_page }) => {
    try {
      const data = await client.listProjects(status, per_page ?? 10);

      if (!data.data || data.data.length === 0) {
        return { content: [{ type: "text", text: "📭 No deployments found." }] };
      }

      const projectList = data.data.map((p: any) => {
        return [
          `• ${p.filename} (${p.deploy_id})`,
          `  Status: ${p.status} | Progress: ${p.progress}%`,
          p.target_url ? `  URL: ${p.target_url}` : null,
          `  Created: ${p.created_at}`,
        ].filter(Boolean).join("\n");
      }).join("\n\n");

      return {
        content: [{
          type: "text",
          text: `📦 Deployments (${data.pagination.total} total):\n\n${projectList}`,
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Failed to list projects: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ════════════════════════════════════════════════════════════════
// TOOL 6: list_servers
// ════════════════════════════════════════════════════════════════
server.tool(
  "list_servers",
  "List all configured server credentials. Returns server IDs needed for deploy_project.",
  {},
  async () => {
    try {
      const data = await client.listCredentials();

      if (!data.data || data.data.length === 0) {
        return {
          content: [{
            type: "text",
            text: "📭 No servers configured. Add servers at your OtoInstall dashboard.",
          }],
        };
      }

      const serverList = data.data.map((s: any) => {
        return `• [ID: ${s.id}] ${s.label} — ${s.protocol}://${s.username}@${s.host}:${s.port}${s.remote_path ?? ""}`;
      }).join("\n");

      return {
        content: [{
          type: "text",
          text: `🖥️ Configured Servers:\n\n${serverList}\n\nUse the ID number with deploy_project's credential_id parameter.`,
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Failed to list servers: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ════════════════════════════════════════════════════════════════
// TOOL 7: whoami
// ════════════════════════════════════════════════════════════════
server.tool(
  "whoami",
  "Check the current API key owner and permissions.",
  {},
  async () => {
    try {
      const data = await client.me();
      return {
        content: [{
          type: "text",
          text: [
            `👤 OtoInstall Account`,
            ``,
            `Name: ${data.user.name}`,
            `Email: ${data.user.email}`,
            ``,
            `🔑 API Key: ${data.api_key.prefix}`,
            `📋 Scopes: ${data.api_key.scopes.join(", ")}`,
            `📊 Rate Limit: ${data.api_key.rate_limit}/hour`,
            data.api_key.last_used ? `⏱️ Last Used: ${data.api_key.last_used}` : null,
          ].filter(Boolean).join("\n"),
        }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Auth failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ─── Start Server ───
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 OtoInstall MCP Server running (stdio transport)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
