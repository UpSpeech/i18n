// Fails if a key's {{placeholders}} differ between en, es and pt. A missing
// {{name}} renders a sentence without the name; an extra or misspelt one
// renders the literal braces. scripts/placeholder-allowlist.json lists the
// keys that differ on purpose, as "namespace:key" with a reason.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = join(root, "locales");
const langs = ["en", "es", "pt"];
const allowlist = JSON.parse(readFileSync(join(root, "scripts", "placeholder-allowlist.json"), "utf8"));

const strings = (obj, prefix = "", acc = {}) => {
  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") strings(value, path, acc);
    else if (typeof value === "string") acc[path] = value;
  }
  return acc;
};

const placeholders = (s) =>
  [...new Set([...s.matchAll(/\{\{\s*([\w.]+)[^}]*\}\}/g)].map((m) => m[1]))].sort().join(",");

const load = (lang) => {
  const out = {};
  for (const [tree, prefix] of [["", ""], ["mobile", "mobile_"]]) {
    const dir = join(localesDir, tree, lang);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (file.endsWith(".json"))
        out[prefix + file.replace(/\.json$/, "")] = strings(JSON.parse(readFileSync(join(dir, file), "utf8")));
    }
  }
  return out;
};

const byLang = Object.fromEntries(langs.map((lang) => [lang, load(lang)]));
const problems = [];
const seenAllowed = new Set();

for (const namespace of Object.keys(byLang.en)) {
  for (const key of Object.keys(byLang.en[namespace])) {
    const sets = langs.map((lang) => {
      const v = byLang[lang][namespace]?.[key];
      return typeof v === "string" ? placeholders(v) : null;
    });
    if (sets.includes(null) || sets.every((s) => s === sets[0])) continue;
    const id = `${namespace}:${key}`;
    if (id in allowlist) {
      seenAllowed.add(id);
      continue;
    }
    problems.push(`${id}  ${langs.map((l, i) => `${l}={${sets[i]}}`).join(" ")}`);
  }
}

for (const id of Object.keys(allowlist))
  if (!seenAllowed.has(id)) problems.push(`${id}  is allowlisted but its placeholders now match, remove it`);

if (problems.length) {
  console.error(`Placeholder check FAILED:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("Placeholder check passed.");
