<div align="center">

# 🚀 OtoInstall Developer Tools

### AI ile Kodladın — Biz Yayınlıyoruz

**Deploy your AI-generated projects to live servers in 60 seconds.**

[![VSCode Extension](https://img.shields.io/badge/VSCode-Extension-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://otoinstall.com/#developer-tools)
[![MCP Server](https://img.shields.io/badge/MCP-Server-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNy45M2MtMy45NS0uNDktNy0zLjg1LTctNy45MyAwLS42Mi4wOC0xLjIxLjIxLTEuNzlMOSAxNXYxYzAgMS4xLjkgMiAyIDJ2MS45M3ptNi45LTIuNTRjLS4yNi0uODEtMS0xLjM5LTEuOS0xLjM5aC0xdi0zYzAtLjU1LS40NS0xLTEtMUg4di0yaDJjLjU1IDAgMS0uNDUgMS0xVjdoMmMxLjEgMCAyLS45IDItMnYtLjQxYzIuOTMgMS4xOSA1IDQuMDYgNSA3LjQxIDAgMi4wOC0uOCAzLjk3LTIuMSA1LjM5eiIvPjwvc3ZnPg==)](https://otoinstall.com/#developer-tools)
[![CLI Tool](https://img.shields.io/badge/CLI-Tool-10b981?style=for-the-badge&logo=gnubash&logoColor=white)](https://otoinstall.com/#developer-tools)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Website](https://otoinstall.com) · [Documentation](https://otoinstall.com/docs) · [Get API Key](https://otoinstall.com/register)

</div>

---

## 🤖 What is OtoInstall?

OtoInstall is the **deployment bridge** between AI coding tools and live servers. Built for the **Vibe Coding** era.

You code with **Cursor, Bolt, Lovable, v0.dev, Claude, ChatGPT** — we handle deployment, security scanning, and server setup automatically.

```
AI writes code → OtoInstall deploys it → Your site is LIVE in 60 seconds
```

---

## 📦 Developer Tools

### 1. MCP Server (Model Context Protocol)

Let your AI assistant deploy directly. Works with **9+ AI tools**.

```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "@otoinstall/mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Supported AI Tools:**
| Tool | Config Location |
|------|----------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Cursor | Settings → MCP Servers |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Cline | VSCode Settings → Cline MCP |
| Continue | `~/.continue/config.json` |
| Zed | Settings → Assistant → MCP |
| Roo Code | Settings → MCP Servers |
| Antigravity | Settings → MCP Servers |
| GitHub Copilot | `.github/copilot-mcp.json` |

**Available MCP Tools:**
- `deploy_project` — Deploy a directory to live server
- `deploy_zip` — Deploy a ZIP file
- `check_deploy_status` — Real-time deployment progress
- `view_deploy_logs` — Deployment history & logs
- `list_servers` — Available servers
- `list_projects` — Your projects
- `get_server_credentials` — Server access info

---

### 2. VSCode Extension

One-click deploy from your editor.

**Install:**
```bash
# Download .vsix from otoinstall.com
code --install-extension otoinstall-1.0.0.vsix
```

**Features:**
- 🚀 Right-click → Deploy Project
- 📊 Real-time progress notifications
- 🔑 Secure API key management
- 📜 Deploy log viewer
- 🖥️ Server selector (QuickPick)
- ⚡ Status bar deploy button

**Commands:**
| Command | Description |
|---------|-------------|
| `OtoInstall: Deploy Project` | Deploy current workspace |
| `OtoInstall: Deploy ZIP` | Deploy a ZIP file |
| `OtoInstall: Check Status` | Check deployment status |
| `OtoInstall: View Logs` | View deployment history |
| `OtoInstall: List Servers` | Browse available servers |
| `OtoInstall: List Projects` | Browse your projects |
| `OtoInstall: Set API Key` | Configure authentication |

---

### 3. CLI Tool

Deploy from your terminal. Perfect for CI/CD.

```bash
# Quick deploy
npx @otoinstall/cli deploy

# Login first
npx @otoinstall/cli login

# Deploy current directory
npx @otoinstall/cli deploy ./my-project

# Deploy ZIP
npx @otoinstall/cli deploy --zip ./project.zip

# Check status
npx @otoinstall/cli status <deploy-id>

# View logs
npx @otoinstall/cli logs
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  AI Coding Tools                │
│  Cursor · Claude · Bolt · Lovable · v0 · GPT   │
└────────────────┬───────────────────┬────────────┘
                 │                   │
     ┌───────────▼───────┐ ┌────────▼────────┐
     │   MCP Protocol    │ │  VSCode / CLI   │
     │  (7 tools)        │ │  (7 commands)   │
     └───────────┬───────┘ └────────┬────────┘
                 │                   │
         ┌───────▼───────────────────▼───────┐
         │         OtoInstall API            │
         │    https://otoinstall.com/api/v1  │
         └───────────────┬───────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Deployment Engine  │
              │  ┌────────────────┐ │
              │  │ Security Scan  │ │
              │  │ Auto-Fix (AI)  │ │
              │  │ FTP/SFTP/SSH   │ │
              │  │ SSL Setup      │ │
              │  │ DNS Config     │ │
              │  └────────────────┘ │
              └──────────┬──────────┘
                         │
                   ┌─────▼─────┐
                   │  LIVE! 🌐 │
                   └───────────┘
```

---

## 🔐 Security

- **API Key Authentication** — Every request requires a valid key
- **HTTPS Only** — All communication encrypted via TLS 1.3
- **File Filtering** — Sensitive files (`.env`, `.git`, `node_modules`) never uploaded
- **Security Scanning** — AI-powered vulnerability detection before deployment
- **Argon2id Hashing** — Password security
- **Rate Limiting** — API abuse protection

---

## 🚀 Quick Start

1. **Sign up** at [otoinstall.com](https://otoinstall.com/register)
2. **Get your API key** from Dashboard → API Keys
3. **Choose your tool:**

```bash
# MCP Server (for AI tools)
# Add the config above to your AI tool's settings

# VSCode Extension
# Download from otoinstall.com/#developer-tools

# CLI
npx @otoinstall/cli login
npx @otoinstall/cli deploy
```

---

## 📝 API Reference

Base URL: `https://otoinstall.com/api/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/deploy` | POST | Deploy project (multipart) |
| `/deploy/{id}/status` | GET | Deployment status |
| `/deploy/{id}/logs` | GET | Deployment logs |
| `/servers` | GET | List servers |
| `/projects` | GET | List projects |
| `/servers/{id}/credentials` | GET | Server credentials |

**Authentication:** `Authorization: Bearer YOUR_API_KEY`

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [OVK Digital](https://ovkweb.com)**

[Website](https://otoinstall.com) · [Twitter](https://twitter.com/otoinstall) · [Discord](https://discord.gg/otoinstall)

</div>
