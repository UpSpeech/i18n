// Fails if, inside any one quiz question, the longest option is more than
// MAX_RATIO times the length of the shortest. Answer length must not hint at
// which option is correct. This file deliberately knows nothing about which
// answer IS correct (those indices live in app-backend seeds); balanced options
// make the tell impossible regardless.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_RATIO = 1.75;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const langs = ["en", "es", "pt"];
const trees = ["", "mobile"];

function collect(obj, path, out) {
  if (Array.isArray(obj)) return;
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const next = path ? `${path}.${key}` : key;
      if (key === "options" && Array.isArray(value)) out.push([path, value]);
      else collect(value, next, out);
    }
  }
}

const failures = [];
for (const tree of trees) {
  for (const lang of langs) {
    const file = join(root, "locales", tree, lang, "quiz.json");
    if (!existsSync(file)) continue;
    const found = [];
    collect(JSON.parse(readFileSync(file, "utf8")), "", found);
    for (const [question, options] of found) {
      const lens = options.map((o) => o.length);
      const ratio = Math.max(...lens) / Math.min(...lens);
      if (ratio > MAX_RATIO) {
        failures.push(
          `${tree || "web"}/${lang} ${question} ratio ${ratio.toFixed(2)} (lengths ${lens.join(", ")})`
        );
      }
    }
  }
}

if (failures.length) {
  console.error(`Option-length balance check failed (max ratio ${MAX_RATIO}):\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\n${failures.length} question(s) out of balance.`);
  process.exit(1);
}
console.log("Option-length balance OK.");
