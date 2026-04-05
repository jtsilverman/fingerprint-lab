package main

import (
	"os"
	"testing"
)

func tempStore(t *testing.T) *Store {
	t.Helper()
	f, err := os.CreateTemp("", "fp-test-*.db")
	if err != nil {
		t.Fatal(err)
	}
	path := f.Name()
	f.Close()
	t.Cleanup(func() { os.Remove(path) })

	store, err := NewStore(path)
	if err != nil {
		t.Fatalf("NewStore: %v", err)
	}
	t.Cleanup(func() { store.Close() })
	return store
}

func TestNewStore(t *testing.T) {
	store := tempStore(t)
	if store == nil {
		t.Fatal("expected non-nil store")
	}
}

func TestInsertAndGetStats(t *testing.T) {
	store := tempStore(t)

	if err := store.RecordFingerprint("abc123", "TestAgent/1.0"); err != nil {
		t.Fatalf("RecordFingerprint: %v", err)
	}

	total, matches, err := store.GetStats("abc123")
	if err != nil {
		t.Fatalf("GetStats: %v", err)
	}
	if total != 1 {
		t.Errorf("total = %d, want 1", total)
	}
	if matches != 1 {
		t.Errorf("matches = %d, want 1", matches)
	}
}

func TestGetStatsNoMatch(t *testing.T) {
	store := tempStore(t)

	if err := store.RecordFingerprint("abc123", "TestAgent/1.0"); err != nil {
		t.Fatal(err)
	}

	total, matches, err := store.GetStats("other-hash")
	if err != nil {
		t.Fatalf("GetStats: %v", err)
	}
	if total != 1 {
		t.Errorf("total = %d, want 1", total)
	}
	if matches != 0 {
		t.Errorf("matches = %d, want 0", matches)
	}
}

func TestDuplicateHashes(t *testing.T) {
	store := tempStore(t)

	// Insert same hash twice (not unique constraint, just duplicate entries)
	store.RecordFingerprint("dup", "Agent/1")
	store.RecordFingerprint("dup", "Agent/2")
	store.RecordFingerprint("other", "Agent/3")

	total, matches, err := store.GetStats("dup")
	if err != nil {
		t.Fatal(err)
	}
	if total != 3 {
		t.Errorf("total = %d, want 3", total)
	}
	if matches != 2 {
		t.Errorf("matches = %d, want 2", matches)
	}
}

func TestGetGlobalStats(t *testing.T) {
	store := tempStore(t)

	store.RecordFingerprint("aaa", "Agent/1")
	store.RecordFingerprint("aaa", "Agent/2")
	store.RecordFingerprint("bbb", "Agent/3")

	total, unique, err := store.GetGlobalStats()
	if err != nil {
		t.Fatal(err)
	}
	if total != 3 {
		t.Errorf("total = %d, want 3", total)
	}
	if unique != 2 {
		t.Errorf("unique = %d, want 2", unique)
	}
}

func TestEmptyStore(t *testing.T) {
	store := tempStore(t)

	total, matches, err := store.GetStats("nonexistent")
	if err != nil {
		t.Fatal(err)
	}
	if total != 0 || matches != 0 {
		t.Errorf("empty store: total=%d matches=%d, want 0,0", total, matches)
	}

	total, unique, err := store.GetGlobalStats()
	if err != nil {
		t.Fatal(err)
	}
	if total != 0 || unique != 0 {
		t.Errorf("empty store global: total=%d unique=%d, want 0,0", total, unique)
	}
}
