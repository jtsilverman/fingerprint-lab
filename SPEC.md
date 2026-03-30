# Fingerprint Lab - SPEC

## Overview

Interactive browser fingerprinting tool that tests every known fingerprinting vector and shows exactly how identifiable your browser is. Tests cutting-edge 2026 vectors including the V8 DevTools detection via ECMAScript Proxy spec compliance. Goes beyond AmIUnique with a modern UI, per-vector entropy scoring, and techniques no other public tool tests for.

Inspired by the viral "ECMAScript spec forces V8 to leak whether DevTools is open" post. The twist: a comprehensive, well-designed fingerprinting lab that includes vectors other tools miss, with clear explanations of how each one works.

## Scope

### Phase 1 - Core
- Static web app that runs all fingerprint tests client-side
- Core fingerprinting vectors: canvas, WebGL, AudioContext, screen/display, navigator properties, fonts, timezone
- Results dashboard showing each vector's value and a combined fingerprint hash
- Deploy to GitHub Pages

### Phase 2 - Full Product
- Advanced vectors: V8 DevTools detection (Proxy trap), WebRTC IP leak, CSS feature detection, speech synthesis voices, media devices, battery API, Bluetooth/USB availability, performance timing, Math constants, error message fingerprinting
- Per-vector entropy estimation using known distribution data (hardcoded from research papers)
- Uniqueness score (estimated bits of identifying information)
- Detailed explanations for each vector (how it works, why it matters, how to mitigate)
- "Compare" mode: hash the full fingerprint, store in backend, show how many others share your fingerprint
- Go backend API for fingerprint comparison (stores hashed fingerprints in SQLite)
- Visual privacy score gauge
- Export fingerprint as JSON
- Ship: README, deploy frontend to GitHub Pages, backend to Railway

### Phase 3 - Stretch
- Browser comparison mode: test in multiple browsers, show which vectors differ
- Mitigation suggestions per vector (which extensions/settings reduce fingerprinting)
- Historical tracking: come back later, see if your fingerprint changed
- WebGPU fingerprinting (GPU compute shader output differences)

### Not Building
- Browser extension
- Mobile app
- User accounts/auth
- Commercial API

### Ship Target
- GitHub Pages (frontend)
- Railway (backend API)
- GitHub (jtsilverman/fingerprint-lab)

## Project Type
Pure code (frontend + backend)

## Stack
- **Frontend:** Vanilla JavaScript + HTML + CSS. No framework. Fingerprinting APIs are all native browser APIs. A framework would add complexity without value.
- **Backend:** Go + SQLite. Minimal API for fingerprint comparison. Go for performance and to add variety (Jake has 2 Go projects, both CLIs, this is a web API).
- **Deploy:** GitHub Pages (static frontend), Railway (Go backend with Dockerfile)
- Diversity note: Jake has no vanilla JS web app in his portfolio. Every frontend so far uses React or a framework. This shows raw browser API knowledge.

## Architecture

```
fingerprint-lab/
  frontend/
    index.html          # Main page
    css/
      style.css         # Dark theme, responsive layout
    js/
      main.js           # App initialization, UI orchestration
      collectors/
        canvas.js       # Canvas 2D fingerprinting
        webgl.js        # WebGL renderer, vendor, extensions
        audio.js        # AudioContext fingerprinting
        navigator.js    # Navigator properties
        screen.js       # Screen/display properties
        fonts.js        # Font enumeration via canvas measurement
        timezone.js     # Timezone and locale
        devtools.js     # V8 DevTools Proxy trap detection
        webrtc.js       # WebRTC IP leak
        css.js          # CSS feature detection
        speech.js       # Speech synthesis voices
        media.js        # Media devices enumeration
        performance.js  # Performance timing precision
        math.js         # Math constant precision
        errors.js       # Error message fingerprinting
      entropy.js        # Entropy estimation from known distributions
      hash.js           # Fingerprint hashing (SHA-256 via SubtleCrypto)
      api.js            # Backend API client
      ui.js             # DOM manipulation, results rendering
  backend/
    main.go             # HTTP server, routes
    store.go            # SQLite fingerprint storage
    handlers.go         # API handlers
    go.mod
    go.sum
    Dockerfile
  README.md
```

### API Contract

```
POST /api/fingerprint
Body: { "hash": "sha256hex", "vectors": { "canvas": "hash", "webgl": "hash", ... } }
Response: { "total_seen": 12345, "matches": 3, "uniqueness_pct": 99.97 }

GET /api/stats
Response: { "total_fingerprints": 12345, "unique_pct": 94.2 }
```

### Data Models

```go
type Fingerprint struct {
    Hash      string    `json:"hash"`
    Vectors   map[string]string `json:"vectors"`
    CreatedAt time.Time `json:"created_at"`
    UserAgent string    `json:"user_agent"`
}
```

```javascript
// Frontend vector result
{
  name: "Canvas 2D",
  category: "rendering",
  value: "hash or raw value",
  displayValue: "human-readable summary",
  entropy: 8.2,        // estimated bits
  description: "How it works...",
  mitigation: "How to reduce this..."
}
```

## Task List

# Phase 1: Core

## 1A: Project Scaffold

### Task 1A.1: Frontend scaffold
**Files:** `frontend/index.html` (create), `frontend/css/style.css` (create), `frontend/js/main.js` (create), `frontend/js/ui.js` (create), `frontend/js/hash.js` (create)
**Do:** Create the HTML shell with dark theme (0d1117 background, GitHub-dark inspired). Include a header, results container div, and footer. CSS with responsive grid for vector cards. main.js initializes the app and calls collectors. ui.js renders vector results as cards. hash.js provides SHA-256 hashing via SubtleCrypto.
**Validate:** Open `frontend/index.html` in browser, see styled page with header and empty results area. No console errors.

## 1B: Core Collectors

### Task 1B.1: Canvas 2D fingerprint
**Files:** `frontend/js/collectors/canvas.js` (create)
**Do:** Create an offscreen canvas, draw specific shapes, text with custom fonts, gradients, and emoji. Extract toDataURL() and hash it. Different GPUs/browsers render pixels slightly differently. Return { name, value, displayValue, description }.
**Validate:** Import in main.js, run collector, verify it returns a hash string in the browser console.

### Task 1B.2: WebGL fingerprint
**Files:** `frontend/js/collectors/webgl.js` (create)
**Do:** Get WebGL context, extract: renderer, vendor, supported extensions list, max texture size, max viewport dimensions, shader precision formats. Combine into a fingerprint hash. Return result object.
**Validate:** Console shows WebGL renderer string and hash.

### Task 1B.3: AudioContext fingerprint
**Files:** `frontend/js/collectors/audio.js` (create)
**Do:** Create offline AudioContext, generate a triangle oscillator signal, process through DynamicsCompressor, capture output buffer. Hash the audio sample values. Different audio stacks produce slightly different floating-point results.
**Validate:** Console shows audio fingerprint hash.

### Task 1B.4: Navigator properties
**Files:** `frontend/js/collectors/navigator.js` (create)
**Do:** Collect: userAgent, platform, hardwareConcurrency, deviceMemory, languages, maxTouchPoints, cookieEnabled, doNotTrack, webdriver. Combine into fingerprint.
**Validate:** Console shows navigator properties object.

### Task 1B.5: Screen and display
**Files:** `frontend/js/collectors/screen.js` (create)
**Do:** Collect: screen.width, height, availWidth, availHeight, colorDepth, pixelDepth, window.devicePixelRatio, orientation. Combine into fingerprint.
**Validate:** Console shows screen properties.

### Task 1B.6: Font enumeration
**Files:** `frontend/js/collectors/fonts.js` (create)
**Do:** Test a list of 100+ common fonts by measuring text width/height with a baseline font vs test font using canvas measureText. If dimensions change, the font is installed. Return list of detected fonts.
**Validate:** Console shows list of detected fonts (varies by OS).

### Task 1B.7: Timezone and locale
**Files:** `frontend/js/collectors/timezone.js` (create)
**Do:** Collect: Intl.DateTimeFormat().resolvedOptions().timeZone, timezone offset, locale, date formatting quirks. Combine into fingerprint.
**Validate:** Console shows timezone info.

## 1C: Results Dashboard

### Task 1C.1: Wire up collectors and render results
**Files:** `frontend/js/main.js` (modify), `frontend/js/ui.js` (modify), `frontend/css/style.css` (modify)
**Do:** main.js runs all collectors in parallel (Promise.all), passes results to ui.js. ui.js renders each result as a card in a responsive grid. Each card shows: vector name, category badge, fingerprint value (truncated), and a brief description. Show a combined fingerprint hash at the top. Add a "Running tests..." loading state.
**Validate:** Open index.html, see all 7 vector cards populated with real values. Combined hash shown at top.

# Phase 2: Full Product

## 2A: Advanced Collectors

### Task 2A.1: V8 DevTools detection
**Files:** `frontend/js/collectors/devtools.js` (create)
**Do:** Implement the Proxy trap technique from the ECMAScript spec leak. Create an object with a Proxy prototype that has an ownKeys trap. Pass to console.groupEnd(). If the trap fires, DevTools/CDP Runtime domain is active. This is the headline feature. Include detailed explanation of why this works (5-layer execution path from Inspector serialization to spec-mandated trap invocation).
**Validate:** Open page with DevTools closed (shows "not detected"), open DevTools and refresh (shows "detected").

### Task 2A.2: WebRTC IP leak
**Files:** `frontend/js/collectors/webrtc.js` (create)
**Do:** Create RTCPeerConnection with STUN server, create data channel and offer. Parse ICE candidates for local and public IP addresses. This reveals real IPs even behind VPNs in some browsers.
**Validate:** Console shows detected IP addresses (or "blocked" if browser prevents it).

### Task 2A.3: CSS feature detection
**Files:** `frontend/js/collectors/css.js` (create)
**Do:** Use CSS.supports() and @supports to detect which CSS features the browser supports. Different browser versions support different feature sets, creating a version fingerprint. Test 30+ features.
**Validate:** Console shows CSS feature support list.

### Task 2A.4: Speech synthesis voices
**Files:** `frontend/js/collectors/speech.js` (create)
**Do:** Query speechSynthesis.getVoices(). The available voice list varies by OS and browser. Hash the voice names and languages.
**Validate:** Console shows voice list fingerprint.

### Task 2A.5: Media devices and performance
**Files:** `frontend/js/collectors/media.js` (create), `frontend/js/collectors/performance.js` (create)
**Do:** media.js: Enumerate media devices (navigator.mediaDevices.enumerateDevices) for device count and types (without requesting permissions). performance.js: Measure performance.now() precision (varies by browser privacy settings), test Performance API timing resolution.
**Validate:** Console shows media device count and performance timing precision.

### Task 2A.6: Math constants and error messages
**Files:** `frontend/js/collectors/math.js` (create), `frontend/js/collectors/errors.js` (create)
**Do:** math.js: Compute Math.tan()/sin()/cos() of specific values, check precision differences across engines. errors.js: Trigger specific JavaScript errors and capture the error message format (V8 vs SpiderMonkey vs JavaScriptCore produce different messages for the same error).
**Validate:** Console shows math precision values and error message signatures.

## 2B: Entropy and Scoring

### Task 2B.1: Entropy estimation
**Files:** `frontend/js/entropy.js` (create)
**Do:** For each vector, estimate entropy (bits of identifying information) using known distribution data from research. Hardcode distributions from published studies (e.g., canvas ~8 bits, userAgent ~10 bits, fonts ~7 bits, screen ~4 bits). Calculate total estimated entropy by summing independent vectors. Show uniqueness as "1 in N" where N = 2^total_entropy.
**Validate:** Page shows entropy bits per vector and total uniqueness estimate.

### Task 2B.2: Visual privacy score
**Files:** `frontend/js/ui.js` (modify), `frontend/css/style.css` (modify)
**Do:** Add a privacy score gauge at the top of the page. Score based on total entropy: <20 bits = "Low" (green), 20-30 = "Medium" (yellow), >30 = "High" (red). Animated circular gauge or bar. Show "Your browser is identifiable as 1 in X" prominently.
**Validate:** Page shows animated score gauge with correct color coding.

## 2C: Explanations and Export

### Task 2C.1: Vector detail panels
**Files:** `frontend/js/ui.js` (modify), `frontend/css/style.css` (modify)
**Do:** Make each vector card expandable. Clicking reveals: full raw value, how the fingerprinting technique works (2-3 sentences), entropy contribution, and how to mitigate it (browser settings, extensions). The DevTools detection card should have an especially detailed explanation of the V8 spec leak.
**Validate:** Click a vector card, see expanded detail panel with explanation.

### Task 2C.2: JSON export
**Files:** `frontend/js/main.js` (modify)
**Do:** Add "Export as JSON" button that downloads the full fingerprint data as a JSON file. Include all vector names, values, entropy estimates, and the combined hash.
**Validate:** Click export, get a valid JSON file download.

## 2D: Comparison Backend

### Task 2D.1: Go API server
**Files:** `backend/main.go` (create), `backend/go.mod` (create), `backend/store.go` (create), `backend/handlers.go` (create)
**Do:** Minimal Go HTTP server. POST /api/fingerprint accepts a fingerprint hash and vector hashes, stores in SQLite, returns match count and total seen. GET /api/stats returns aggregate stats. CORS headers for GitHub Pages frontend. Rate limit: 1 submission per IP per minute.
**Validate:** `go build && curl -X POST localhost:8080/api/fingerprint -d '{"hash":"test","vectors":{}}' ` returns JSON response.

### Task 2D.2: Frontend API integration
**Files:** `frontend/js/api.js` (create), `frontend/js/main.js` (modify), `frontend/js/ui.js` (modify)
**Do:** After collecting all vectors, optionally submit to backend API. Show "X out of Y visitors share your fingerprint" if backend is available. Graceful fallback if backend is down (just show local results). Add opt-in toggle ("Compare with others").
**Validate:** With backend running, submit fingerprint and see comparison results on page.

## 2E: Ship

### Task 2E.1: README and deploy
**Files:** `README.md` (create), `backend/Dockerfile` (create)
**Do:** Write portfolio-ready README. Deploy frontend to GitHub Pages. Create Dockerfile for backend. Deploy backend to Railway. Verify end-to-end: visit GitHub Pages URL, see fingerprint results, comparison works.
**Validate:** GitHub Pages URL loads, all vectors run, comparison API responds.

# Phase 3: Stretch

## 3A: Browser Comparison

### Task 3A.1: Multi-browser diff view
**Files:** `frontend/js/compare.js` (create), `frontend/js/ui.js` (modify)
**Do:** Allow saving a fingerprint locally (localStorage). Visit in another browser, save that too. Show side-by-side diff of which vectors changed. Highlights the vectors that make cross-browser linking possible vs impossible.
**Validate:** Save fingerprint, see it listed. Compare view shows diff.

## 3B: WebGPU Fingerprinting

### Task 3B.1: WebGPU compute shader fingerprint
**Files:** `frontend/js/collectors/webgpu.js` (create)
**Do:** If WebGPU is available, run a compute shader with specific floating-point operations. Different GPUs produce slightly different results for the same shader. This is a cutting-edge vector that no public tool tests for.
**Validate:** In a WebGPU-capable browser, see GPU compute fingerprint. Graceful fallback if not supported.

## The One Hard Thing

**Implementing the V8 DevTools detection via ECMAScript Proxy spec compliance.**

Why it's hard: The technique exploits a subtle interaction between V8's Inspector serialization, prototype chain traversal, and the ECMAScript spec's requirement that Proxy ownKeys traps must be invoked. Getting the Proxy/prototype chain setup exactly right is critical. The detection only works when Chrome DevTools Protocol's Runtime domain is enabled (not just any dev tools feature).

Approach: Implement exactly as described in the source blog post. Create an object whose prototype is a Proxy with an ownKeys trap. Pass to console.groupEnd(). The 5-layer execution path (Inspector serialization -> surface-level Proxy check bypass -> prototype chain traversal -> key accumulation -> spec-mandated trap invocation) causes the trap to fire only when DevTools is active.

Fallback: If the specific Proxy technique doesn't work in all Chrome versions, fall back to the well-known console.log timing detection (DevTools slows down console output). Less elegant but reliable.

## Risks

- **Low - DevTools detection browser compatibility:** The Proxy technique is V8-specific (Chrome/Edge). Firefox and Safari won't trigger it. Mitigation: clearly label as "Chrome/Edge only" and show "not applicable" on other browsers.
- **Low - WebRTC blocking:** Modern browsers increasingly block WebRTC IP leaks. Mitigation: show "blocked by browser" as a positive privacy finding.
- **Low - Entropy estimation accuracy:** Hardcoded distribution data may not reflect current browser populations. Mitigation: cite sources, note estimates are approximate.
