package models

import "time"

type CredentialType string

const (
  TypeAWS      CredentialType = "aws"
  TypeAzure    CredentialType = "azure"
  TypeAD       CredentialType = "ad"
  TypeSSH      CredentialType = "ssh"
  TypeAPIToken CredentialType = "api_token"
  TypeGeneric  CredentialType = "generic"
)

type Credential struct {
  ID        string            `json:"id"`
  ProjectID string            `json:"project_id"`
  Label     string            `json:"label"`
  Type      CredentialType    `json:"type"`
  Subtype   string            `json:"subtype"`
  Username  string            `json:"username,omitempty"`
  Secret    string            `json:"secret,omitempty"`
  Metadata  map[string]string `json:"metadata,omitempty"`
  Tags      []string          `json:"tags,omitempty"`
  Source    string            `json:"source,omitempty"`
  Valid     bool              `json:"valid"`
  CreatedAt time.Time         `json:"created_at"`
  Operator  string            `json:"operator,omitempty"`
}

type Project struct {
  ID          string         `json:"id"`
  Name        string         `json:"name"`
  Type        CredentialType `json:"type"`
  Description string         `json:"description,omitempty"`
  CreatedAt   time.Time      `json:"created_at"`
}
