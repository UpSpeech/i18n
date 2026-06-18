// Fails if any key present in one language is missing in another (per namespace).
// Keeps en/es/pt aligned before publish.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = join(root, "locales");
const langs = ["en", "es", "pt"];

const flat = (o, p = "", r = {}) => {
  for (const k in o) {
    const v = o[k];
    const nk = p ? `${p}.${k}` : k;
    v && typeof v === "object" ? flat(v, nk, r) : (r[nk] = true);
  }
  return r;
};

function keysFor(lang) {
  const out = {};
  const langDir = join(localesDir, lang);
  for (const file of readdirSync(langDir)) {
    if (!file.endsWith(".json")) continue;
    const ns = file.replace(/\.json$/, "");
    out[ns] = flat(JSON.parse(readFileSync(join(langDir, file), "utf8")));
  }
  const mobileLangDir = join(localesDir, "mobile", lang);
  if (existsSync(mobileLangDir)) {
    for (const file of readdirSync(mobileLangDir)) {
      if (!file.endsWith(".json")) continue;
      out[`mobile_${file.replace(/\.json$/, "")}`] = flat(JSON.parse(readFileSync(join(mobileLangDir, file), "utf8")));
    }
  }
  return out;
}

const byLang = Object.fromEntries(langs.map((l) => [l, keysFor(l)]));
const allNs = new Set(langs.flatMap((l) => Object.keys(byLang[l])));
let problems = 0;

for (const ns of allNs) {
  const union = new Set();
  for (const l of langs) for (const k of Object.keys(byLang[l][ns] || {})) union.add(k);
  for (const l of langs) {
    const have = byLang[l][ns] || {};
    const missing = [...union].filter((k) => !have[k]);
    if (missing.length) {
      problems += missing.length;
      console.error(`[${l}] ${ns}: ${missing.length} missing key(s): ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? " ..." : ""}`);
    }
  }
}

if (problems) {
  console.error(`\nParity check FAILED: ${problems} missing key(s).`);
  process.exit(1);
}
console.log("Parity check passed: en/es/pt aligned across all namespaces.");
