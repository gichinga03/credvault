A desktop credential manager built for red team operators. Manage tokens, tickets, passwords, hashes and secrets from penetration testing engagements — organized by project, searchable, and copyable in tool-ready formats.

Built with Go + Wails + React. Runs as a native desktop application with no browser required, no internet connection, and no external dependencies.

---

## Screenshots

> Add credentials, copy in tool-ready formats, mark burned, filter by project.

---

## Features

- **Project-based organization** — each project is locked to one credential type (Azure, AWS, AD, SSH, API Token, Generic). No mixing.
- **Rich credential subtypes** — not just passwords. Kerberos tickets, PRTs, NTLM hashes, access tokens, refresh tokens, silver/golden tickets, DPAPI blobs, SSH certs, JWTs, OAuth2 tokens and more.
- **Tool-ready copy formats** — one click copies in the exact format your tool expects:
  - AD → Impacket, CrackMapExec, plain `DOMAIN\user:pass`, Rubeus `/ptt`, Mimikatz `kerberos::ptt`
  - Azure → `az login --service-principal`, env block
  - AWS → env block, `~/.aws/credentials` block
  - API tokens → `Authorization: Bearer`, `X-API-Key` header
- **Burn tracking** — mark credentials as burned when rotated or detected. They stay visible but dimmed for reference.
- **Audit log** — every reveal, copy, edit and burn is logged to the local database with a timestamp.
- **Clipboard auto-clear** — copied secrets are cleared from clipboard after 30 seconds.
- **Search and filter** — search across label, username, tags and subtype. Filter by valid/burned.
- **Fully offline** — no network calls, no telemetry, no cloud sync. Everything stays on disk.
- **Cross-platform** — Linux and Windows binaries available.

---

## Credential Types and Subtypes

### Azure
| Subtype | Description |
|---|---|
| Client Secret | Service principal secret |
| Access Token (JWT) | Short-lived JWT access token |
| Refresh Token | Long-lived refresh token |
| PRT | Primary Refresh Token from a device |
| PRT Cookie | `x-ms-RefreshTokenCredential` cookie value |
| Service Principal Certificate | PFX or PEM certificate |
| User Password | Standard user account password |

### Active Directory
| Subtype | Description |
|---|---|
| Password | Plaintext password |
| NTLM Hash | `LM:NT` hash format |
| Kerberos TGT | Base64 TGT blob (Rubeus, Mimikatz output) |
| Kerberos TGS | Base64 service ticket |
| Silver Ticket | Forged service ticket |
| Golden Ticket | Forged TGT using krbtgt hash |
| rev2self Token | Impersonation token handle or notes |
| DPAPI Blob | Base64 DPAPI blob or masterkey |
| Certificate | PFX or PEM certificate |

### AWS
| Subtype | Description |
|---|---|
| IAM Access Key | `AKIA...` access key + secret |
| STS Session Token | Temporary STS credentials |
| Role ARN | Role to assume |

### SSH
| Subtype | Description |
|---|---|
| Private Key | RSA, ED25519, ECDSA private key |
| SSH Certificate | Signed SSH certificate |
| Password | SSH password auth |

### API Token
| Subtype | Description |
|---|---|
| Bearer Token | Generic bearer token |
| JWT | JSON Web Token |
| OAuth2 Token | OAuth2 access token |
| Session Cookie | Web session cookie |
| API Key | Generic API key |

---

## Installation

### Windows

1. Download `credvault-desktop-amd64-installer.exe` from the [releases page](../../releases)
2. Run the installer — it will install WebView2 if not already present
3. Launch CredVault from the Start Menu or Desktop shortcut
4. Data is stored at `%APPDATA%\CredVault\vault.db`

### Linux

```bash
# Download the binary
wget https://github.com/YOUR_USERNAME/credvault/releases/latest/download/credvault-desktop

# Make executable
chmod +x credvault-desktop

# Run
./credvault-desktop
```

Data is stored at `~/.credvault/vault.db`

---

## Building from Source

### Prerequisites

- Go 1.22+
- Node.js 20+
- Wails CLI v2

```bash
# Install Wails
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Linux build dependencies
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.0-dev

# Windows installer dependency (Linux cross-compile)
sudo apt install -y nsis
```

### Build

```bash
git clone https://github.com/YOUR_USERNAME/credvault
cd credvault

# Linux binary
wails build -platform linux/amd64

# Windows installer
wails build -platform windows/amd64 -nsis

# Outputs
ls build/bin/
# credvault-desktop                      (Linux)
# credvault-desktop.exe                  (Windows raw)
# credvault-desktop-amd64-installer.exe  (Windows installer with WebView2)
```

### Development mode

```bash
wails dev
```

Opens a native desktop window with hot reload. Go changes recompile automatically, frontend changes hot-reload via Vite.

---

## Architecture

credvault/
├── main.go # Wails entry point, app directory setup, logging
├── app.go # All Go functions exposed to the frontend
├── models/
│ └── credential.go # Credential and Project structs
├── db/
│ ├── schema.go # SQLite schema and migrations (modernc pure Go)
│ └── credentials.go # All DB read/write operations
├── crypto/
│ └── vault.go # AES-GCM encryption helpers (unused in local mode)
└── frontend/
└── src/
├── App.tsx # Main layout, sidebar, project management
├── api.ts # Wails JS bindings (calls Go directly, no HTTP)
├── types.ts # TypeScript types, subtype definitions, copy formats
└── components/
├── AddCredModal.tsx # Add/edit credential form
├── CredTable.tsx # Credential table with inline row actions
├── CopyMenu.tsx # Copy format dropdown with clipboard clear
├── FilterBar.tsx # Search and filter controls
└── NewProjectModal.tsx # New project form with type selector


### How the frontend talks to Go

Unlike a typical web app, there is no HTTP server. Wails generates JavaScript bindings directly from the Go functions in `app.go`. The frontend calls them like normal async functions:

```typescript
// No fetch(), no URLs, no ports
import { ListCreds, CreateCred, CopyCred } from '../wailsjs/go/main/App'

const creds = await ListCreds(projectId, '', '', false)
const formatted = await CopyCred(credId, 'impacket')
```

Wails handles the bridge between the WebView2 renderer and the Go process over an internal IPC channel.

### Database

SQLite via `modernc.org/sqlite` — a pure Go port of SQLite with no C dependencies. This means the binary cross-compiles cleanly to Windows without needing `gcc` or any C toolchain on the build machine.

Schema:

```sql
projects (id, name, type, description, created_at)
credentials (id, project_id, label, type, subtype, username, secret,
             metadata, tags, source, valid, created_at, operator)
audit_log (id, cred_id, action, operator, timestamp)
```

Secrets are stored as plaintext in the local SQLite file since this is a local-only tool. The `crypto/vault.go` module provides AES-GCM helpers if encryption is added in a future version.

### Data locations

| OS | Path |
|---|---|
| Linux | `~/.credvault/vault.db` |
| Windows | `%APPDATA%\CredVault\vault.db` |
| macOS | `~/Library/Application Support/CredVault/vault.db` |

---

## Usage

### Creating a project

1. Click **+ New project** in the sidebar
2. Enter a name (e.g. `Acme Corp - Internal`)
3. Select the credential type — the project will only hold this type
4. Optionally add a description
5. Click **Create project**

### Adding a credential

1. Select a project from the sidebar
2. Click **+ Add credential**
3. Select the subtype (e.g. for Azure: Access Token, PRT, Client Secret)
4. Fill in the label — use anything that helps you identify it quickly (email, display name, object ID, UPN)
5. Paste the secret in the secret field — large paste area for tickets and tokens
6. Add comma-separated tags (e.g. `da, high-value, kerberoastable`)
7. Set the source (phished, dumped, sprayed, loot, other)
8. Click **Add credential**

### Copying in tool format

Each row has a **Copy ▾** button that opens a format menu based on the credential type:

- **AD / Kerberos TGT** → `Rubeus.exe ptt /ticket:<base64>` or `kerberos::ptt <base64>`
- **AD / Password** → `DOMAIN/user:pass` (Impacket), `-u user -p pass -d domain` (CME)
- **Azure / Access Token** → raw JWT ready to paste
- **AWS** → `export AWS_ACCESS_KEY_ID=... export AWS_SECRET_ACCESS_KEY=...`

The secret is fetched from the database, formatted, and written to the clipboard. It is automatically cleared after 30 seconds.

### Marking credentials as burned

Click **⋯ → Mark burned** on any credential. It stays in the table at reduced opacity for reference but is excluded from the **Valid only** filter.

### Searching

Use the search bar to filter across label, username, tags and subtype simultaneously. Use the **Valid only** checkbox to hide burned credentials.

---

## Releasing

Tag and push — GitHub Actions builds both Linux and Windows binaries automatically:

```bash
git tag -a v1.1.0 -m "release notes here"
git push origin v1.1.0
```

The workflow at `.github/workflows/release.yml` builds for both platforms and publishes to the GitHub releases page.

---

## Known Issues

- **Windows**: requires WebView2 runtime. Use the installer (`-amd64-installer.exe`) which bundles it automatically.
- **macOS**: not tested, build support exists but unsigned binaries will be blocked by Gatekeeper.
- Secrets are stored unencrypted in the local SQLite database. Do not sync `vault.db` to cloud storage.

---

## License

For authorized security testing use only.
GOEOF