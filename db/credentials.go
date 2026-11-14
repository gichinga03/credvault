package db

import (
  "database/sql"
  "encoding/json"
  "fmt"
  "strings"
  "time"

  "credvault-desktop/models"
)

func CreateProject(p *models.Project) error {
  _, err := DB.Exec(
    `INSERT INTO projects (id, name, type, description, created_at) VALUES (?,?,?,?,?)`,
    p.ID, p.Name, p.Type, p.Description, p.CreatedAt,
  )
  return err
}

func ListProjects() ([]models.Project, error) {
  rows, err := DB.Query(`SELECT id, name, type, description, created_at FROM projects ORDER BY created_at DESC`)
  if err != nil { return nil, err }
  defer rows.Close()
  var projects []models.Project
  for rows.Next() {
    var p models.Project
    if err := rows.Scan(&p.ID, &p.Name, &p.Type, &p.Description, &p.CreatedAt); err != nil {
      return nil, err
    }
    projects = append(projects, p)
  }
  return projects, nil
}

func DeleteProject(id string) error {
  _, err := DB.Exec(`DELETE FROM projects WHERE id = ?`, id)
  return err
}

func InsertCredential(c *models.Credential, secret string) error {
  meta, _ := json.Marshal(c.Metadata)
  tags := strings.Join(c.Tags, ",")
  _, err := DB.Exec(`
    INSERT INTO credentials
      (id, project_id, label, type, subtype, username, secret, metadata, tags, source, valid, created_at, operator)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    c.ID, c.ProjectID, c.Label, c.Type, c.Subtype,
    c.Username, secret,
    string(meta), tags, c.Source,
    boolToInt(c.Valid), c.CreatedAt, c.Operator,
  )
  return err
}

func GetCredential(id string) (*models.Credential, string, error) {
  var c models.Credential
  var secret, metaJSON, tagsStr string
  var validInt int

  err := DB.QueryRow(`
    SELECT id, project_id, label, type, subtype, username, secret, metadata, tags, source, valid, created_at, operator
    FROM credentials WHERE id = ?`, id,
  ).Scan(
    &c.ID, &c.ProjectID, &c.Label, &c.Type, &c.Subtype,
    &c.Username, &secret, &metaJSON, &tagsStr,
    &c.Source, &validInt, &c.CreatedAt, &c.Operator,
  )
  if err != nil {
    if err == sql.ErrNoRows { return nil, "", fmt.Errorf("credential not found") }
    return nil, "", err
  }
  c.Valid = validInt == 1
  c.Tags = parseTags(tagsStr)
  if err := json.Unmarshal([]byte(metaJSON), &c.Metadata); err != nil {
    c.Metadata = map[string]string{}
  }
  return &c, secret, nil
}

type CredFilter struct {
  ProjectID string
  Type      string
  ValidOnly bool
  Search    string
}

func ListCredentials(f CredFilter) ([]models.Credential, error) {
  query := `SELECT id, project_id, label, type, subtype, username, metadata, tags, source, valid, created_at, operator
            FROM credentials WHERE 1=1`
  args := []any{}
  if f.ProjectID != "" { query += " AND project_id = ?"; args = append(args, f.ProjectID) }
  if f.Type      != "" { query += " AND type = ?";       args = append(args, f.Type) }
  if f.ValidOnly       { query += " AND valid = 1" }
  if f.Search    != "" {
    query += " AND (label LIKE ? OR username LIKE ? OR tags LIKE ? OR subtype LIKE ?)"
    s := "%" + f.Search + "%"
    args = append(args, s, s, s, s)
  }
  query += " ORDER BY created_at DESC"

  rows, err := DB.Query(query, args...)
  if err != nil { return nil, err }
  defer rows.Close()

  var creds []models.Credential
  for rows.Next() {
    var c models.Credential
    var metaJSON, tagsStr string
    var validInt int
    if err := rows.Scan(
      &c.ID, &c.ProjectID, &c.Label, &c.Type, &c.Subtype,
      &c.Username, &metaJSON, &tagsStr,
      &c.Source, &validInt, &c.CreatedAt, &c.Operator,
    ); err != nil { return nil, err }
    c.Valid = validInt == 1
    c.Tags = parseTags(tagsStr)
    if err := json.Unmarshal([]byte(metaJSON), &c.Metadata); err != nil {
      c.Metadata = map[string]string{}
    }
    creds = append(creds, c)
  }
  return creds, nil
}

func UpdateCredential(c *models.Credential, secret string) error {
  meta, _ := json.Marshal(c.Metadata)
  tags := strings.Join(c.Tags, ",")
  _, err := DB.Exec(`
    UPDATE credentials
    SET label=?, type=?, subtype=?, username=?, secret=?, metadata=?, tags=?, source=?, valid=?, operator=?
    WHERE id=?`,
    c.Label, c.Type, c.Subtype, c.Username, secret,
    string(meta), tags, c.Source, boolToInt(c.Valid),
    c.Operator, c.ID,
  )
  return err
}

func BurnCredential(id string) error {
  _, err := DB.Exec(`UPDATE credentials SET valid = 0 WHERE id = ?`, id)
  return err
}

func DeleteCredential(id string) error {
  _, err := DB.Exec(`DELETE FROM credentials WHERE id = ?`, id)
  return err
}

func LogAudit(credID, action, operator string) error {
  _, err := DB.Exec(
    `INSERT INTO audit_log (cred_id, action, operator, timestamp) VALUES (?,?,?,?)`,
    credID, action, operator, time.Now(),
  )
  return err
}

func boolToInt(b bool) int {
  if b { return 1 }
  return 0
}

func parseTags(s string) []string {
  if s == "" { return []string{} }
  parts := strings.Split(s, ",")
  out := make([]string, 0, len(parts))
  for _, p := range parts {
    if t := strings.TrimSpace(p); t != "" { out = append(out, t) }
  }
  return out
}
