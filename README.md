# Fingerprint Lab

Interactive browser fingerprinting tool that tests 15 vectors and shows exactly how identifiable your browser is. Includes the V8 DevTools detection via ECMAScript Proxy spec compliance, a technique discovered in March 2026 that no other public tool tests for.

## Demo

[Live Demo](https://jtsilverman.github.io/fingerprint-lab/frontend/)

## The Problem

Every website can identify your browser without cookies. Your screen resolution, GPU model, installed fonts, timezone, and dozens of other signals combine into a unique fingerprint. Tools like AmIUnique exist but are outdated, miss modern vectors, and don't explain what's happening. Fingerprint Lab tests 15 vectors including cutting-edge techniques and shows which ones make you unique.

## How It Works

All fingerprinting runs client-side in your browser. Nothing is sent to a server unless you opt in to comparison.

### 15 Fingerprinting Vectors

| Vector | Category | Entropy | What it reveals |
|--------|----------|---------|-----------------|
| Canvas 2D | Rendering | ~8.2 bits | GPU-specific pixel rendering |
| WebGL | Rendering | ~7.5 bits | GPU model, driver, extensions |
| AudioContext | Hardware | ~5.4 bits | Audio processing differences |
| Navigator | Browser | ~10.2 bits | CPU cores, RAM, languages |
| Screen | Hardware | ~4.2 bits | Resolution, pixel ratio |
| Fonts | Browser | ~7.1 bits | Installed font list |
| Timezone | Browser | ~3.8 bits | Timezone, locale |
| **DevTools Detection** | **Security** | **~1.0 bit** | **Whether Chrome DevTools is open** |
| WebRTC | Network | ~3.0 bits | Real IP addresses (VPN bypass) |
| CSS Features | Browser | ~4.5 bits | Supported CSS features |
| Speech Voices | Hardware | ~5.8 bits | Installed TTS voices |
| Media Devices | Hardware | ~2.8 bits | Microphone/camera count |
| Timer Precision | Browser | ~2.5 bits | performance.now() precision |
| Math Precision | Browser | ~2.0 bits | Floating-point differences across engines |
| Error Messages | Browser | ~2.2 bits | JS engine error format |

### The V8 DevTools Detection

The headline feature exploits a subtle interaction in Chrome's V8 engine. When DevTools is open, Chrome's Inspector serializes all `console.*` arguments for preview. We create an object whose prototype is a Proxy with an `ownKeys` trap. The Inspector walks the prototype chain, hits the Proxy, and the ECMAScript spec requires it to invoke the trap. The trap fires only when DevTools is active.

This works because of three intersecting design decisions in V8:
1. Unconditional preview serialization on all console arguments
2. Proxy guards that only check the immediate value, not the prototype chain
3. Eager key accumulation during iterator construction

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML, CSS. No frameworks. All fingerprinting uses native browser APIs.
- **Backend:** Go + SQLite. Minimal comparison API. Stores hashed fingerprints, returns uniqueness stats.
- **Deploy:** GitHub Pages (frontend), Railway (backend API)

## The Hard Part

The V8 DevTools detection required understanding the exact 5-layer execution path from Chrome's Inspector through to the ECMAScript spec's mandatory Proxy trap invocation. The technique creates an object with a Proxy prototype (not the object itself being a Proxy), which bypasses V8's surface-level Proxy check. The Inspector then walks the prototype chain during key collection, discovers the Proxy, and the spec leaves V8 no choice but to call the `ownKeys` trap.

Getting this to work reliably required understanding that `console.groupEnd()` triggers the same serialization path as `console.log()`, and that the detection only fires when Chrome DevTools Protocol's Runtime domain is enabled (which happens when DevTools is open).

## Getting Started

```bash
# Frontend only (no backend needed)
cd frontend
python3 -m http.server 8000
# Open http://localhost:8000

# With comparison backend
cd backend
go build -o server .
./server  # Listens on :8080
```

## License

MIT
