#!/usr/bin/env node
/**
 * SECURITY FIX (VAPT: "Secret Extraction from Binary" — Point 154, flagged
 * "Needs Implementation": "tracked alongside related bundle/secret-exposure
 * items" — i.e. items 155/159/180, which confirmed by manual review that no
 * backend secret currently leaks into the frontend bundle). This script
 * makes that check automatic and repeatable instead of relying on someone
 * remembering to grep the build output before every release.
 *
 * Recursively scans a build output directory (default: dist/) for patterns
 * that indicate a secret was bundled into client-shipped code: cloud
 * provider key formats, private key PEM headers, and generic
 * secret/token/apiKey-style assignments with a suspiciously long value.
 *
 * Exits non-zero (and fails the build, if wired into a build script) when
 * anything is found, so a leaked secret blocks the release instead of
 * shipping silently.
 *
 * Usage:
 *   node scripts/scan-secrets.js [dist-dir]
 *
 * Wired into package.json as: "build": "vite --mode local build && npm run scan:secrets"
 */

const fs = require("fs");
const path = require("path");

const targetDir = process.argv[2] || "dist";
const SCAN_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".css", ".html", ".json", ".map"]);

// Known third-party key formats — these are always a genuine finding
// regardless of variable name.
const KNOWN_KEY_PATTERNS = [
    { name: "AWS Access Key ID", regex: /AKIA[0-9A-Z]{16}/g },
    { name: "AWS Secret Access Key (assignment)", regex: /aws(.{0,20})?(secret|access)[_-]?key['"]?\s*[:=]\s*['"][A-Za-z0-9\/+=]{40}['"]/gi },
    { name: "Google API Key", regex: /AIza[0-9A-Za-z\-_]{35}/g },
    { name: "Stripe Live Secret Key", regex: /sk_live_[0-9a-zA-Z]{16,}/g },
    { name: "Slack Token", regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
    { name: "PEM Private Key", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
    { name: "JWT (looks like a live/signed token, not just a client-side decoder)", regex: /eyJhbGciOi[0-9A-Za-z-_]+\.[0-9A-Za-z-_]+\.[0-9A-Za-z-_]{20,}/g },
];

// Generic "name = long random-looking string" patterns — flagged as
// warnings since these commonly false-positive on non-secret constants
// (build hashes, CSS class names, etc.), so they're reported but don't
// necessarily need the same urgency as a KNOWN_KEY_PATTERNS hit.
const GENERIC_ASSIGNMENT_PATTERN =
    /\b(secret[_-]?key|api[_-]?key|access[_-]?token|client[_-]?secret|private[_-]?key|db[_-]?password|smtp[_-]?password)['"]?\s*[:=]\s*['"]([A-Za-z0-9+/_\-]{20,})['"]/gi;

// Allow-listing legitimate, intentionally-public values so the scan doesn't
// cry wolf on every run. Add entries here only for values that are
// genuinely meant to be public (e.g. a reCAPTCHA *site* key, a Firebase
// client config apiKey — Firebase web API keys are not secrets by design).
const ALLOWLIST_SUBSTRINGS = [
    // e.g. "AIzaSyDummyPublicFirebaseWebApiKeyForCI"
];

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, files);
        } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }
    return files;
}

function scanFile(filePath) {
    const findings = [];
    const content = fs.readFileSync(filePath, "utf8");

    for (const { name, regex } of KNOWN_KEY_PATTERNS) {
        const matches = content.match(regex);
        if (matches) {
            for (const m of matches) {
                if (ALLOWLIST_SUBSTRINGS.some((a) => m.includes(a))) continue;
                findings.push({ file: filePath, type: name, sample: redact(m) });
            }
        }
    }

    let genericMatch;
    GENERIC_ASSIGNMENT_PATTERN.lastIndex = 0;
    while ((genericMatch = GENERIC_ASSIGNMENT_PATTERN.exec(content)) !== null) {
        const full = genericMatch[0];
        if (ALLOWLIST_SUBSTRINGS.some((a) => full.includes(a))) continue;
        findings.push({ file: filePath, type: `Generic secret-like assignment (${genericMatch[1]})`, sample: redact(full) });
    }

    return findings;
}

// Never print the actual secret value to CI logs — just enough to locate it.
function redact(value) {
    if (value.length <= 12) return value.slice(0, 4) + "…";
    return value.slice(0, 6) + "…" + value.slice(-4);
}

function main() {
    const files = walk(targetDir);
    if (files.length === 0) {
        process.exit(0);
    }

    let allFindings = [];
    for (const file of files) {
        allFindings = allFindings.concat(scanFile(file));
    }

    if (allFindings.length === 0) {
        process.exit(0);
    }

    for (const f of allFindings) {
    }
    process.exit(1);
}

main();