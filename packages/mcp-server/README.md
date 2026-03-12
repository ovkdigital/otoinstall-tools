# 🚀 @otoinstall/mcp-server

**Deploy projects from any AI tool with a single command.**

Works with **Claude Desktop**, **Cursor**, **Windsurf**, **Cline**, **Continue**, **Zed**, **Roo Code**, **Amazon Q**, and any MCP-compatible AI assistant.

---

## Quick Start

### 1. Get Your API Key

Sign up at [otoinstall.com](https://otoinstall.com) → Dashboard → **API Keys** → Create Key

### 2. Configure Your AI Tool

Choose your tool below and add the configuration:

---

## 🤖 Claude Desktop

Edit `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "@otoinstall/mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here",
        "OTOINSTALL_BASE_URL": "https://otoinstall.com"
      }
    }
  }
}
```

---

## 🖱️ Cursor

Settings → **MCP Servers** → Add:

```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "@otoinstall/mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here"
      }
    }
  }
}
```

Or via `.cursor/mcp.json` in your project root.

---

## 🏄 Windsurf

Settings → **MCP** → Add server:

```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "@otoinstall/mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here"
      }
    }
  }
}
```

---

## 🔌 Cline (VS Code Extension)

Cline settings → **MCP Servers** → Add:

```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "@otoinstall/mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here"
      }
    }
  }
}
```

---

## ➡️ Continue (VS Code / JetBrains)

Edit `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@otoinstall/mcp-server"],
          "env": {
            "OTOINSTALL_API_KEY": "oi_live_your_key_here"
          }
        }
      }
    ]
  }
}
```

---

## ⚡ Zed

Edit `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "otoinstall": {
      "command": {
        "path": "npx",
        "args": ["-y", "@otoinstall/mcp-server"],
        "env": {
          "OTOINSTALL_API_KEY": "oi_live_your_key_here"
        }
      }
    }
  }
}
```

---

## 🦘 Roo Code

`.roo/mcp.json`:

```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "@otoinstall/mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here"
      }
    }
  }
}
```

---

## 🔧 Antigravity (Google Gemini)

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "otoinstall": {
      "command": "npx",
      "args": ["-y", "@otoinstall/mcp-server"],
      "env": {
        "OTOINSTALL_API_KEY": "oi_live_your_key_here"
      }
    }
  }
}
```

---

## 🏗️ Any MCP-Compatible Tool

The universal configuration pattern:

```json
{
  "command": "npx",
  "args": ["-y", "@otoinstall/mcp-server"],
  "env": {
    "OTOINSTALL_API_KEY": "oi_live_your_key_here",
    "OTOINSTALL_BASE_URL": "https://otoinstall.com"
  }
}
```

---

## 🛠️ Available Tools

| Tool | Description |
|---|---|
| `deploy_project` | Zip & deploy a project directory to a live server |
| `deploy_zip` | Deploy an existing ZIP file |
| `check_deploy_status` | Check deployment progress and status |
| `get_deploy_logs` | View detailed deployment logs |
| `list_projects` | List all your deployments |
| `list_servers` | List configured server credentials |
| `whoami` | Check API key owner and permissions |

---

## 💬 Usage Examples

### Deploy from Claude

```
You: "Deploy this project to my server"
Claude: I'll deploy the project. First, let me check your servers.
       [calls list_servers]
       You have 1 server: [ID: 1] MyVPS — sftp://user@myserver.com
       [calls deploy_project with directory and credential_id=1]
       ✅ Deployment started! Deploy ID: 01HYJ3R8KQFG...
       [calls check_deploy_status]
       🎉 Deployment completed! Your site is live at https://mysite.com
```

### Deploy from Cursor

```
You: "Publish this to production"
Cursor: [calls deploy_project]
        ✅ Your project has been deployed!
        🌐 Live at: https://yourproject.com
```

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OTOINSTALL_API_KEY` | ✅ | — | Your OtoInstall API key |
| `OTOINSTALL_BASE_URL` | ❌ | `https://otoinstall.com` | API base URL |

---

## 📦 Local Development

```bash
git clone https://github.com/otoinstall/mcp-server
cd mcp-server
npm install
npm run build
```

Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## License

MIT © OtoInstall
