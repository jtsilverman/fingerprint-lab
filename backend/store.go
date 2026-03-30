package main

import (
	"database/sql"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Store struct {
	db *sql.DB
}

func NewStore(path string) (*Store, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS fingerprints (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		hash TEXT NOT NULL,
		user_agent TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS idx_hash ON fingerprints(hash)`)
	if err != nil {
		return nil, err
	}

	return &Store{db: db}, nil
}

func (s *Store) RecordFingerprint(hash, userAgent string) error {
	_, err := s.db.Exec(
		"INSERT INTO fingerprints (hash, user_agent, created_at) VALUES (?, ?, ?)",
		hash, userAgent, time.Now().UTC(),
	)
	return err
}

func (s *Store) GetStats(hash string) (total int, matches int, err error) {
	err = s.db.QueryRow("SELECT COUNT(*) FROM fingerprints").Scan(&total)
	if err != nil {
		return
	}
	err = s.db.QueryRow("SELECT COUNT(*) FROM fingerprints WHERE hash = ?", hash).Scan(&matches)
	return
}

func (s *Store) GetGlobalStats() (total int, unique int, err error) {
	err = s.db.QueryRow("SELECT COUNT(*) FROM fingerprints").Scan(&total)
	if err != nil {
		return
	}
	err = s.db.QueryRow("SELECT COUNT(DISTINCT hash) FROM fingerprints").Scan(&unique)
	return
}

func (s *Store) Close() error {
	return s.db.Close()
}
