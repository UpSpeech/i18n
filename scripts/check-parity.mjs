// Fails if any key present in one language is missing in another (per namespace),
// or if a namespace file is empty. Keeps en/es/pt aligned.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = join(root, "locales");
const langs = ["en", "es", "pt"];

// Leaf values by key. Arrays flatten by index, so an empty string in one is caught.
const flatten = (obj, prefix = "", acc = {}) => {
  for (const key in obj) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    value && typeof value === "object" ? flatten(value, fullKey, acc) : (acc[fullKey] = value);
  }
  return acc;
};

// A count right before a plural noun ("{{count}} steps") needs a _one form, or
// a count of 1 renders "1 steps". i18next falls back to the bare key for other counts.
const PLURAL_AFTER_COUNT = /\{\{count\}\}\s+[A-Za-z]+(?:s|\(s\))(?![A-Za-z])/;

function namespacesFor(lang) {
  const out = {};
  const langDir = join(localesDir, lang);
  for (const file of readdirSync(langDir)) {
    if (!file.endsWith(".json")) continue;
    out[file.replace(/\.json$/, "")] = flatten(JSON.parse(readFileSync(join(langDir, file), "utf8")));
  }
  const mobileLangDir = join(localesDir, "mobile", lang);
  if (existsSync(mobileLangDir)) {
    for (const file of readdirSync(mobileLangDir)) {
      if (!file.endsWith(".json")) continue;
      out[`mobile_${file.replace(/\.json$/, "")}`] = flatten(
        JSON.parse(readFileSync(join(mobileLangDir, file), "utf8"))
      );
    }
  }
  return out;
}

const byLang = Object.fromEntries(langs.map((lang) => [lang, namespacesFor(lang)]));
const allNamespaces = new Set(langs.flatMap((lang) => Object.keys(byLang[lang])));
let problems = 0;

for (const namespace of allNamespaces) {
  const union = new Set();
  for (const lang of langs) for (const key of Object.keys(byLang[lang][namespace] || {})) union.add(key);

  if (union.size === 0) {
    problems += 1;
    console.error(`${namespace}: every language's file is empty (no keys)`);
    continue;
  }

  for (const lang of langs) {
    const have = byLang[lang][namespace] || {};
    if (Object.keys(have).length === 0) {
      problems += 1;
      console.error(`[${lang}] ${namespace}: file missing or empty`);
      continue;
    }
    const missing = [...union].filter((key) => !(key in have));
    // Blank in every language is a deliberate empty; blank in one is a gap.
    const isBlank = (v) => typeof v === "string" && v.trim() === "";
    const empty = Object.keys(have).filter(
      (key) =>
        isBlank(have[key]) &&
        langs.some((other) => {
          const v = byLang[other][namespace]?.[key];
          return typeof v === "string" && !isBlank(v);
        })
    );
    if (empty.length) {
      problems += empty.length;
      console.error(`[${lang}] ${namespace}: ${empty.length} empty value(s): ${empty.slice(0, 8).join(", ")}`);
    }
    if (lang === "en") {
      const bare = Object.keys(have).filter(
        (key) =>
          !/_(one|other)$/.test(key) &&
          typeof have[key] === "string" &&
          PLURAL_AFTER_COUNT.test(have[key]) &&
          !(`${key}_one` in have)
      );
      if (bare.length) {
        problems += bare.length;
        console.error(`[en] ${namespace}: ${bare.length} count string(s) without a _one form: ${bare.slice(0, 8).join(", ")}`);
      }
    }
    if (missing.length) {
      problems += missing.length;
      console.error(
        `[${lang}] ${namespace}: ${missing.length} missing key(s): ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? " ..." : ""}`
      );
    }
  }
}

if (problems) {
  console.error(`\nParity check FAILED: ${problems} problem(s).`);
  process.exit(1);
}
console.log("Parity check passed: en/es/pt aligned across all namespaces.");
