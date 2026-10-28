// Copy validator (no model). Checks a batch file of touches with blocks "## T<n> | company | email | subject".
// Usage: node tools/validate-copy.js <batch.md> [<batch2.md> ...]
// Exits 1 on errors; warnings don't block. Try it: node tools/validate-copy.js data/sample-batch.md
const fs = require("fs");

const BANNED = [
  "15 minutes", "you hire directly", "dedicated", "i'll stop writing", "last note",
  "i won't keep", "keep us in mind", "only for", "nobody else", "no one else",
  "40 hours", "full workweek", "stays long term", "next week", "monday", "tuesday",
  "wednesday", "thursday", "friday", "—", "–",
];
const NGRAM = 6; // a 6-word phrase shared across emails is the template signal

const files = process.argv.slice(2);
if (!files.length) { console.error("Usage: node validate-copy.js <batch.md>"); process.exit(2); }

const blocks = [];
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  for (const part of txt.split(/^## /m).slice(1)) {
    const [head, ...rest] = part.split("\n");
    if (!/^T\d/.test(head)) continue;
    const body = rest.join("\n").trim()
      .replace(/^Hi [^,\n]+,?\s*/i, "")     // greeting is allowed to repeat
      .replace(/\n[A-Z][a-z]+ [A-Z][a-z]+\n[\s\S]*$/, "") // signature
      .trim();
    blocks.push({ file: f, head: head.trim(), body });
  }
}

const words = s => s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
let errors = 0, warnings = 0;
const grams = new Map();

for (const b of blocks) {
  const w = words(b.body);
  const low = b.body.toLowerCase();
  const hits = BANNED.filter(p => p.length <= 2
    ? b.body.includes(p)
    : new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(low));
  if (hits.length) { errors++; console.log(`ERROR  ${b.head}\n       banned phrases: ${hits.join(", ")}`); }

  const ft = (low.match(/full-time|full time/g) || []).length;
  if (ft !== 1) { warnings++; console.log(`WARN   ${b.head}\n       "full-time" appears ${ft} times (expected 1)`); }

  const type = b.head.slice(0, 2);
  const [min, max] = type === "T1" ? [30, 65] : [20, 55];
  if (w.length < min || w.length > max) { warnings++; console.log(`WARN   ${b.head}\n       ${w.length} words (${type} range: ${min}-${max})`); }

  for (let i = 0; i + NGRAM <= w.length; i++) {
    const g = w.slice(i, i + NGRAM).join(" ");
    if (!grams.has(g)) grams.set(g, new Set());
    grams.get(g).add(b.head);
  }
}

// Same phrase in 2 emails is a warning; in 3 or more it's a template (error).
for (const [g, set] of grams) {
  if (set.size < 2) continue;
  const level = set.size >= 3 ? "ERROR" : "WARN ";
  level === "ERROR" ? errors++ : warnings++;
  console.log(`${level}  template: "${g}" repeats in ${set.size} emails:\n       ${[...set].join("\n       ")}`);
}

console.log(`\n${blocks.length} emails checked · ${errors} errors · ${warnings} warnings`);
process.exit(errors ? 1 : 0);
