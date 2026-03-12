# 🚀 @otoinstall/cli

**Deploy projects from your terminal in seconds.**

```bash
npx @otoinstall/cli deploy
```

Works with any hosting via FTP / SFTP / SSH.

---

## Install

```bash
# Use directly (no install)
npx @otoinstall/cli deploy

# Or install globally
npm install -g @otoinstall/cli
```

## Setup

```bash
# Configure API key (interactive)
otoinstall login

# Or pass directly
otoinstall login --key oi_live_your_key_here
```

## Commands

### Deploy

```bash
# Deploy current directory
otoinstall deploy

# Deploy specific directory
otoinstall deploy ./my-project

# Deploy a ZIP file
otoinstall deploy --zip project.zip

# Deploy to specific server (skip prompt)
otoinstall deploy --server 1

# Full options
otoinstall deploy ./my-project --server 1 --url https://mysite.com --type laravel
```

### Status & Logs

```bash
# Check deployment status
otoinstall status 01HYJ3R8KQFG...

# View deployment logs
otoinstall logs 01HYJ3R8KQFG...
```

### Server & Project Management

```bash
# List your servers
otoinstall servers

# List recent deployments
otoinstall projects

# Check account info
otoinstall whoami
```

## All Options

| Command | Options | Description |
|---|---|---|
| `deploy [dir]` | `--zip`, `--server`, `--path`, `--url`, `--type` | Deploy a project |
| `status <id>` | — | Check deployment status |
| `logs <id>` | — | View deployment logs |
| `servers` | — | List servers |
| `projects` | — | List deployments |
| `login` | `--key`, `--url` | Configure API key |
| `whoami` | — | Show account info |

## License

MIT © [OtoInstall](https://otoinstall.com)
