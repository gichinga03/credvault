package db

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Init(path string) error {
	var err error
	DB, err = sql.Open("sqlite3", path+"?_foreign_keys=on")
	if err != nil {
		return fmt.Errorf("opening db: %w", err)
	}
	return migrate()
}

func migrate() error {
	_, err := DB.Exec(`
	CREATE TABLE IF NOT EXISTS projects (
		id          TEXT PRIMARY KEY,
		name        TEXT NOT NULL,
		type        TEXT NOT NULL DEFAULT 'generic',
		description TEXT,
		created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS credentials (
		id          TEXT PRIMARY KEY,
		project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
		label       TEXT NOT NULL,
		type        TEXT NOT NULL,
		username    TEXT,
		secret      TEXT NOT NULL,
		metadata    TEXT,
		tags        TEXT,
		source      TEXT,
		valid       INTEGER NOT NULL DEFAULT 1,
		created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
		operator    TEXT
	);

	CREATE TABLE IF NOT EXISTS audit_log (
		id        INTEGER PRIMARY KEY AUTOINCREMENT,
		cred_id   TEXT NOT NULL,
		action    TEXT NOT NULL,
		operator  TEXT,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`)
	return err
}