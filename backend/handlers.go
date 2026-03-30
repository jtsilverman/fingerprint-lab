package main

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

type FingerprintRequest struct {
	Hash    string            `json:"hash"`
	Vectors map[string]string `json:"vectors"`
}

type FingerprintResponse struct {
	TotalSeen    int     `json:"total_seen"`
	Matches      int     `json:"matches"`
	UniquenessPct float64 `json:"uniqueness_pct"`
}

type StatsResponse struct {
	TotalFingerprints int     `json:"total_fingerprints"`
	UniquePct         float64 `json:"unique_pct"`
}

// Simple rate limiter: 1 submission per IP per minute
type rateLimiter struct {
	mu    sync.Mutex
	seen  map[string]time.Time
}

func newRateLimiter() *rateLimiter {
	return &rateLimiter{seen: make(map[string]time.Time)}
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	last, ok := rl.seen[ip]
	if ok && time.Since(last) < time.Minute {
		return false
	}
	rl.seen[ip] = time.Now()
	return true
}

func handleFingerprint(store *Store, limiter *rateLimiter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		ip := r.RemoteAddr
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			ip = fwd
		}

		if !limiter.allow(ip) {
			http.Error(w, "rate limited", http.StatusTooManyRequests)
			return
		}

		var req FingerprintRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}

		if req.Hash == "" {
			http.Error(w, "hash required", http.StatusBadRequest)
			return
		}

		ua := r.Header.Get("User-Agent")
		if err := store.RecordFingerprint(req.Hash, ua); err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		total, matches, err := store.GetStats(req.Hash)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		uniquenessPct := 100.0
		if total > 0 {
			uniquenessPct = (1.0 - float64(matches)/float64(total)) * 100
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(FingerprintResponse{
			TotalSeen:     total,
			Matches:       matches,
			UniquenessPct: uniquenessPct,
		})
	}
}

func handleStats(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		total, unique, err := store.GetGlobalStats()
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		uniquePct := 0.0
		if total > 0 {
			uniquePct = float64(unique) / float64(total) * 100
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(StatsResponse{
			TotalFingerprints: total,
			UniquePct:         uniquePct,
		})
	}
}
