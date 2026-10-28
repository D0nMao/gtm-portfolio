// Sanitization gate. Run before every commit; commit only on exit 0.
// Blocks: real-looking emails (anything not @*.example.com / example.org), private Claude artifact links,
// and any term listed in .sanitize-denylist.local (one per line, never committed: client, prospect and people names).
// Usage: node tools/sanitize-check.js
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set([".git", "node_modules"]);
const DENYLIST_FILE = path.join(ROOT, ".sanitize-denylist.local");
const deny = fs.existsSync(DENYLIST_FILE)
  ? fs.readFileSync(DENYLIST_FILE, "utf8").split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#"))
  : [];
if (!deny.length) console.warn("WARN  .sanitize-denylist.local is missing or empty: names are not being checked.");

const EMAIL = /[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,}/gi;
const ALLOWED_EMAIL = /@([a-z0-9-]+\.)*example\.(com|org)$/i;
// Public contact addresses that are meant to be shown (the author's own), one per line.
const ALLOWLIST_FILE = path.join(ROOT, ".sanitize-allowlist");
const allow = new Set(fs.existsSync(ALLOWLIST_FILE)
  ? fs.readFileSync(ALLOWLIST_FILE, "utf8").split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean)
  : []);
const ARTIFACT = /claude\.ai\/(code\/)?artifact\/[A-Za-z0-9-]+/g;

const findings = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name) || name === ".sanitize-denylist.local") continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    const rel = path.relative(ROOT, p);
    const text = fs.readFileSync(p, "utf8");
    text.split(/\r?\n/).forEach((line, i) => {
      for (const m of line.match(EMAIL) || []) if (!ALLOWED_EMAIL.test(m) && !allow.has(m.toLowerCase())) findings.push(`${rel}:${i + 1}  email: ${m}`);
      for (const m of line.match(ARTIFACT) || []) findings.push(`${rel}:${i + 1}  private link: ${m}`);
      for (const term of deny) if (line.toLowerCase().includes(term.toLowerCase())) findings.push(`${rel}:${i + 1}  denylisted: ${term}`);
    });
  }
}
walk(ROOT);

if (findings.length) {
  console.log(findings.join("\n"));
  console.log(`\nBLOCKED: ${findings.length} finding(s). Fix them before committing.`);
  process.exit(1);
}
console.log(`Clean: no real emails, private links or denylisted terms (${deny.length} terms checked).`);
