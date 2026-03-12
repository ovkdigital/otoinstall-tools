# 🚀 OtoInstall Developer Tools

> **AI ile kodladın, biz yayınlıyoruz!**  
> Deploy your AI-generated projects to any hosting in seconds.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm: mcp-server](https://img.shields.io/npm/v/otoinstall-mcp-server?label=MCP%20Server&color=green)](https://www.npmjs.com/package/otoinstall-mcp-server)
[![npm: cli](https://img.shields.io/npm/v/otoinstall-cli?label=CLI&color=green)](https://www.npmjs.com/package/otoinstall-cli)
[![API Status](https://img.shields.io/endpoint?url=https://otoinstall.com/api/v1/health&label=API&style=flat)](https://otoinstall.com)

---

## 🤔 What is OtoInstall?

OtoInstall is an **automated deployment platform** that takes your web projects (built with Cursor, Lovable, Bolt, v0.dev, or any AI tool) and deploys them to your hosting server with:

- 🔍 **Auto-detection** — Recognizes Laravel, React, Vue, Next.js, WordPress, PHP, HTML
- 🛡️ **Security scanning** — Checks for vulnerabilities before deployment
- 🔧 **Auto-fix** — Resolves compatibility issues automatically
- 🚀 **One-click deploy** — Uploads via FTP/SFTP to your server
- ✅ **Verification** — Confirms your site is live and working

---

## 📦 Available Tools

| Tool | Description | For |
|------|-------------|-----|
| [**MCP Server**](packages/mcp-server/) | Deploy from any MCP-compatible AI tool | Cursor, Claude Desktop, Windsurf, Cline, Zed |
| [**CLI**](packages/cli/) | Deploy from your terminal | Developers, CI/CD |
| [**VS Code Extension**](packages/vscode-extension/) | Deploy with a button click | VS Code users |

---

## ⚡ Quick Start

### 1. Get Your API Key
1. Sign up at [otoinstall.com](https://otoinstall.com/register)
2. Add your server (FTP/SFTP credentials)
3. Create an API key at Dashboard → API Keys

### 2. Choose Your Tool

---

### 🤖 MCP Server (For AI Tools)

Works with **Cursor, Claude Desktop, Windsurf, Cline, Continue, Zed** and any MCP-compatible tool.

**Setup (Cursor):**

Add to `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "otoinstall-mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here"
      }
    }
  }
}
```

**Setup (Claude Desktop):**

Add to `%APPDATA%/Claude/claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):
```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "otoinstall-mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here"
      }
    }
  }
}
```

**Usage:**
```
You: "Deploy this project to my server"
AI: → Lists servers → Zips project → Uploads → Scans → Deploys → "🎉 Your site is live!"
```

**Available Tools:**

| Tool | Description |
|------|-------------|
| `deploy_project` | Zip and deploy a directory |
| `deploy_zip` | Deploy an existing ZIP file |
| `check_deploy_status` | Check deployment progress |
| `get_deploy_logs` | Get deployment logs |
| `list_servers` | List configured servers |
| `list_projects` | List deployment history |
| `whoami` | Account information |

---

### ⌨️ CLI Tool

**Install:**
```bash
npm install -g otoinstall-cli
```

**Usage:**
```bash
# Login
otoinstall login

# Deploy current directory
otoinstall deploy .

# Deploy a ZIP file
otoinstall deploy --zip project.zip

# Deploy to a specific server
otoinstall deploy ./my-app --server 1

# Check status
otoinstall status <deploy-id>

# View logs
otoinstall logs <deploy-id>

# List servers
otoinstall servers
```

---

### 💻 VS Code Extension

**Install:**
1. Download [otoinstall-1.0.0.vsix](https://otoinstall.com/downloads/otoinstall-1.0.0.vsix)
2. In VS Code: Extensions → `...` → **"Install from VSIX..."**
3. Set API key: `Ctrl+Shift+P` → "OtoInstall: Set API Key"

**Usage:**
- Click **"☁️ Deploy"** in the status bar
- Or right-click a folder → **"🚀 Deploy Project"**
- Or press `Ctrl+Shift+D`

---

## 🔌 REST API

All tools communicate through the OtoInstall REST API.

**Base URL:** `https://otoinstall.com/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | System status |
| `GET` | `/me` | ✅ | Account info |
| `GET` | `/credentials` | ✅ | List servers |
| `POST` | `/deploy` | ✅ | Upload ZIP + start deploy |
| `GET` | `/projects` | ✅ | Deployment history |
| `GET` | `/deploy/{id}/status` | ✅ | Deployment status |
| `GET` | `/deploy/{id}/logs` | ✅ | Deployment logs |

**Example:**
```bash
curl -X POST https://otoinstall.com/api/v1/deploy \
  -H "Authorization: Bearer oi_live_your_key" \
  -F "file=@project.zip" \
  -F "credential_id=1" \
  -F "project_type=auto"
```

---

## 🎯 Works With Every AI Tool

| AI Tool | Integration | How |
|---------|-------------|-----|
| **Cursor** | ✅ MCP Server | Say "deploy this project" |
| **Claude Desktop** | ✅ MCP Server | Say "deploy this project" |
| **Windsurf / Cline / Zed** | ✅ MCP Server | Say "deploy this project" |
| **VS Code** | ✅ Extension | Click deploy button |
| **Terminal** | ✅ CLI | `otoinstall deploy .` |
| **Manus** | 🔌 HTTP API | Provide API docs to agent |
| **ChatGPT** | 📦 Export ZIP | Upload at otoinstall.com |
| **Lovable / Bolt / v0.dev** | 📦 Export ZIP | Download → upload or CLI |
| **Replit** | 🔌 HTTP API | Use curl in shell |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- 🌐 **Website:** [otoinstall.com](https://otoinstall.com)
- 📖 **Documentation:** [otoinstall.com/docs](https://otoinstall.com/docs)
- 💬 **Support:** [WhatsApp](https://wa.me/905538404141)
