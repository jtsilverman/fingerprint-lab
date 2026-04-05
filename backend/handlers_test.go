package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func testStoreAndLimiter(t *testing.T) (*Store, *rateLimiter) {
	t.Helper()
	store := tempStore(t)
	limiter := newRateLimiter()
	return store, limiter
}

func TestHandleFingerprintValid(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)
	handler := handleFingerprint(store, limiter)

	body := `{"hash":"abc123","vectors":{"canvas":"data"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/fingerprint", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}

	var resp FingerprintResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.TotalSeen != 1 {
		t.Errorf("TotalSeen = %d, want 1", resp.TotalSeen)
	}
	if resp.Matches != 1 {
		t.Errorf("Matches = %d, want 1", resp.Matches)
	}
}

func TestHandleFingerprintMalformedJSON(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)
	handler := handleFingerprint(store, limiter)

	req := httptest.NewRequest(http.MethodPost, "/api/fingerprint", bytes.NewBufferString("not json"))
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestHandleFingerprintEmptyHash(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)
	handler := handleFingerprint(store, limiter)

	body := `{"hash":"","vectors":{}}`
	req := httptest.NewRequest(http.MethodPost, "/api/fingerprint", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestHandleFingerprintWrongMethod(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)
	handler := handleFingerprint(store, limiter)

	req := httptest.NewRequest(http.MethodGet, "/api/fingerprint", nil)
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", w.Code)
	}
}

func TestHandleStats(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)

	// Seed some data (bypass rate limiter by inserting directly)
	store.RecordFingerprint("hash1", "Agent/1")
	store.RecordFingerprint("hash1", "Agent/2")
	store.RecordFingerprint("hash2", "Agent/3")

	handler := handleStats(store)
	req := httptest.NewRequest(http.MethodGet, "/api/stats", nil)
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}

	var resp StatsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.TotalFingerprints != 3 {
		t.Errorf("TotalFingerprints = %d, want 3", resp.TotalFingerprints)
	}
	// 2 unique out of 3 = 66.67%
	expected := float64(2) / float64(3) * 100
	if resp.UniquePct < expected-0.01 || resp.UniquePct > expected+0.01 {
		t.Errorf("UniquePct = %f, want ~%f", resp.UniquePct, expected)
	}

	_ = limiter // used in setup but stats doesn't need it
}

func TestHandleStatsWrongMethod(t *testing.T) {
	store, _ := testStoreAndLimiter(t)
	handler := handleStats(store)

	req := httptest.NewRequest(http.MethodPost, "/api/stats", nil)
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", w.Code)
	}
}

func TestRateLimiter(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)
	handler := handleFingerprint(store, limiter)

	makeReq := func() int {
		body := `{"hash":"abc123","vectors":{}}`
		req := httptest.NewRequest(http.MethodPost, "/api/fingerprint", bytes.NewBufferString(body))
		req.RemoteAddr = "1.2.3.4:1234"
		w := httptest.NewRecorder()
		handler(w, req)
		return w.Code
	}

	// First request should succeed
	if code := makeReq(); code != http.StatusOK {
		t.Errorf("first request: status = %d, want 200", code)
	}

	// Second request from same IP should be rate limited
	if code := makeReq(); code != http.StatusTooManyRequests {
		t.Errorf("second request: status = %d, want 429", code)
	}
}

func TestRateLimiterDifferentIPs(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)
	handler := handleFingerprint(store, limiter)

	for _, ip := range []string{"1.1.1.1:1000", "2.2.2.2:2000"} {
		body := `{"hash":"abc","vectors":{}}`
		req := httptest.NewRequest(http.MethodPost, "/api/fingerprint", bytes.NewBufferString(body))
		req.RemoteAddr = ip
		w := httptest.NewRecorder()
		handler(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("ip %s: status = %d, want 200", ip, w.Code)
		}
	}
}

func TestRateLimiterXForwardedFor(t *testing.T) {
	store, limiter := testStoreAndLimiter(t)
	handler := handleFingerprint(store, limiter)

	// First request with X-Forwarded-For
	body := `{"hash":"abc","vectors":{}}`
	req := httptest.NewRequest(http.MethodPost, "/api/fingerprint", bytes.NewBufferString(body))
	req.Header.Set("X-Forwarded-For", "10.0.0.1")
	w := httptest.NewRecorder()
	handler(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("first: status = %d, want 200", w.Code)
	}

	// Second request with same X-Forwarded-For should be limited
	req2 := httptest.NewRequest(http.MethodPost, "/api/fingerprint", bytes.NewBufferString(body))
	req2.Header.Set("X-Forwarded-For", "10.0.0.1")
	w2 := httptest.NewRecorder()
	handler(w2, req2)
	if w2.Code != http.StatusTooManyRequests {
		t.Errorf("second: status = %d, want 429", w2.Code)
	}
}
