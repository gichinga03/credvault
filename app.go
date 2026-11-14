package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/google/uuid"

	"credvault-desktop/db"
	"credvault-desktop/models"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dbPath := getDBPath()

	if err := db.Init(dbPath); err != nil {
		panic(fmt.Sprintf("db init: %v", err))
	}
}

func getDBPath() string {
	var dbDir string

	switch runtime.GOOS {
	case "windows":
		// Use %APPDATA%\CredVault on Windows
		appData := os.Getenv("APPDATA")
		if appData == "" {
			appData = filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Roaming")
		}
		dbDir = filepath.Join(appData, "CredVault")
	case "darwin":
		// Use ~/Library/Application Support/CredVault on macOS
		home, _ := os.UserHomeDir()
		dbDir = filepath.Join(home, "Library", "Application Support", "CredVault")
	default:
		// Linux — ~/.credvault
		home, _ := os.UserHomeDir()
		dbDir = filepath.Join(home, ".credvault")
	}

	if err := os.MkdirAll(dbDir, 0700); err != nil {
		panic(fmt.Sprintf("creating db dir %s: %v", dbDir, err))
	}

	return filepath.Join(dbDir, "vault.db")
}

// ── Projects ──────────────────────────────────────────────────────────────────

func (a *App) ListProjects() ([]models.Project, error) {
	projects, err := db.ListProjects()
	if err != nil {
		return nil, err
	}
	if projects == nil {
		return []models.Project{}, nil
	}
	return projects, nil
}

func (a *App) CreateProject(name, projType, description string) (*models.Project, error) {
	p := &models.Project{
		ID:          uuid.New().String(),
		Name:        name,
		Type:        models.CredentialType(projType),
		Description: description,
		CreatedAt:   time.Now(),
	}
	if p.Type == "" {
		p.Type = models.TypeGeneric
	}
	if err := db.CreateProject(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (a *App) DeleteProject(id string) error {
	return db.DeleteProject(id)
}

// ── Credentials ───────────────────────────────────────────────────────────────

func (a *App) ListCreds(projectID, credType, search string, validOnly bool) ([]models.Credential, error) {
	creds, err := db.ListCredentials(db.CredFilter{
		ProjectID: projectID,
		Type:      credType,
		ValidOnly: validOnly,
		Search:    search,
	})
	if err != nil {
		return nil, err
	}
	if creds == nil {
		return []models.Credential{}, nil
	}
	return creds, nil
}

type CredPayload struct {
	ProjectID string            `json:"project_id"`
	Label     string            `json:"label"`
	Type      string            `json:"type"`
	Subtype   string            `json:"subtype"`
	Username  string            `json:"username"`
	Secret    string            `json:"secret"`
	Tags      []string          `json:"tags"`
	Source    string            `json:"source"`
	Metadata  map[string]string `json:"metadata"`
	Operator  string            `json:"operator"`
}

func (a *App) CreateCred(payloadJSON string) (*models.Credential, error) {
	var p CredPayload
	if err := json.Unmarshal([]byte(payloadJSON), &p); err != nil {
		return nil, fmt.Errorf("invalid payload: %w", err)
	}
	c := &models.Credential{
		ID:        uuid.New().String(),
		ProjectID: p.ProjectID,
		Label:     p.Label,
		Type:      models.CredentialType(p.Type),
		Subtype:   p.Subtype,
		Username:  p.Username,
		Tags:      p.Tags,
		Source:    p.Source,
		Metadata:  p.Metadata,
		Valid:     true,
		CreatedAt: time.Now(),
		Operator:  p.Operator,
	}
	if err := db.InsertCredential(c, p.Secret); err != nil {
		return nil, err
	}
	db.LogAudit(c.ID, "create", p.Operator)
	return c, nil
}

func (a *App) UpdateCred(id, payloadJSON string) (*models.Credential, error) {
	var p CredPayload
	if err := json.Unmarshal([]byte(payloadJSON), &p); err != nil {
		return nil, fmt.Errorf("invalid payload: %w", err)
	}
	c := &models.Credential{
		ID:        id,
		ProjectID: p.ProjectID,
		Label:     p.Label,
		Type:      models.CredentialType(p.Type),
		Subtype:   p.Subtype,
		Username:  p.Username,
		Tags:      p.Tags,
		Source:    p.Source,
		Metadata:  p.Metadata,
		Valid:     true,
		Operator:  p.Operator,
	}
	if err := db.UpdateCredential(c, p.Secret); err != nil {
		return nil, err
	}
	db.LogAudit(id, "edit", p.Operator)
	return c, nil
}

func (a *App) RevealCred(id string) (*models.Credential, error) {
	cred, secret, err := db.GetCredential(id)
	if err != nil {
		return nil, err
	}
	db.LogAudit(id, "reveal", "")
	cred.Secret = secret
	return cred, nil
}

func (a *App) BurnCred(id string) error {
	db.LogAudit(id, "burn", "")
	return db.BurnCredential(id)
}

func (a *App) DeleteCred(id string) error {
	db.LogAudit(id, "delete", "")
	return db.DeleteCredential(id)
}

func (a *App) CopyCred(id, format string) (string, error) {
	cred, secret, err := db.GetCredential(id)
	if err != nil {
		return "", err
	}
	db.LogAudit(id, "copy:"+format, "")
	return formatCred(cred, secret, format), nil
}

func formatCred(c *models.Credential, secret, format string) string {
	switch c.Type {
	case models.TypeAWS:
		switch format {
		case "env":
			return "export AWS_ACCESS_KEY_ID=" + c.Username + "\nexport AWS_SECRET_ACCESS_KEY=" + secret
		case "config":
			return "[default]\naws_access_key_id = " + c.Username + "\naws_secret_access_key = " + secret
		}
	case models.TypeAzure:
		tid := c.Metadata["tenant_id"]
		switch format {
		case "env":
			return "export AZURE_TENANT_ID=" + tid + "\nexport AZURE_CLIENT_ID=" + c.Username + "\nexport AZURE_CLIENT_SECRET=" + secret
		case "azcli":
			return "az login --service-principal -u " + c.Username + " -p " + secret + " --tenant " + tid
		}
	case models.TypeAD:
		domain := c.Metadata["domain"]
		switch format {
		case "impacket":
			return domain + "/" + c.Username + ":" + secret
		case "cme":
			return "-u " + c.Username + " -p " + secret + " -d " + domain
		case "plain":
			return domain + `\` + c.Username + ":" + secret
		case "rubeus":
			return "Rubeus.exe ptt /ticket:" + secret
		case "mimikatz":
			return "kerberos::ptt " + secret
		}
	case models.TypeSSH:
		if format == "cmd" {
			return "ssh -i <keyfile> " + c.Username + "@<host>"
		}
	case models.TypeAPIToken:
		switch format {
		case "bearer":
			return "Authorization: Bearer " + secret
		case "header":
			return "X-API-Key: " + secret
		}
	}
	return strings.TrimSpace(secret)
}
