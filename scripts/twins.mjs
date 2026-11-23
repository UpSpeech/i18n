// Pairs each mobile key with the web keys whose English is the same, and says
// whether pt and es agree too. Read-only. Plural and gender forms (key_one,
// key_he, ...) are matched as one family, since i18next picks among them at
// runtime and half a family cannot move.
//
//   node scripts/twins.mjs               summary, and twins.json for tooling
//   node scripts/twins.mjs --markdown    the drifted families, as tables
//   node scripts/twins.mjs --area auth:  only mobile keys starting with that prefix
//   node scripts/twins.mjs --scope auth.  web keys a mobile key may merge into, besides shallow common.*
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLocale, ALIASES } from "../build-locale.js";
import { baseOf } from "./forms.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["en", "pt", "es"];
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : "");
const area = opt("--area");
const scope = opt("--scope").split(",").filter(Boolean);

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const flatten = (obj, prefix = "", acc = {}) => {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    v && typeof v === "object" ? flatten(v, key, acc) : (acc[key] = v);
  }
  return acc;
};

function webKeys(lang) {
  const dir = join(root, "locales", lang);
  const files = {};
  for (const f of readdirSync(dir)) if (f.endsWith(".json")) files[f.slice(0, -5)] = read(join(dir, f));
  const { translation } = buildLocale(files);
  const canonical = {};
  for (const [top, value] of Object.entries(translation)) {
    if (ALIASES.includes(top) || !(value && typeof value === "object")) continue;
    flatten(value, top, canonical);
  }
  return canonical;
}

// The key as app-mobile calls it: common.json and quiz.json under the default
// namespace (quiz nested as quiz.*), auth.json under auth:.
function mobileKeys(lang) {
  const dir = join(root, "locales", "mobile", lang);
  return {
    ...flatten(read(join(dir, "common.json"))),
    ...flatten(read(join(dir, "quiz.json")), "quiz"),
    ...(existsSync(join(dir, "auth.json")) ? flatten(read(join(dir, "auth.json")), "auth:") : {}),
  };
}

const fix = (k) => k.replace(/^auth:\./, "auth:");
const web = Object.fromEntries(LANGS.map((l) => [l, webKeys(l)]));
const mobile = Object.fromEntries(
  LANGS.map((l) => [l, Object.fromEntries(Object.entries(mobileKeys(l)).map(([k, v]) => [fix(k), v]))]),
);

function families(keys) {
  const out = new Map();
  const set = new Set(keys);
  for (const key of keys) {
    const base = baseOf(key, (k) => set.has(k));
    if (!out.has(base)) out.set(base, []);
    out.get(base).push(key.slice(base.length));
  }
  return out;
}

const webFamilies = families(Object.keys(web.en));
const mobileFamilies = families(Object.keys(mobile.en));
const signature = (tree, base, forms) => forms.map((f) => `${f}=${tree[base + f]}`).sort().join("\n");

const webByEn = new Map();
for (const [base, forms] of webFamilies) {
  const sig = signature(web.en, base, forms);
  if (!webByEn.has(sig)) webByEn.set(sig, []);
  webByEn.get(sig).push(base);
}

// Merging into another page's key ties the phone's copy to that page: reword
// patients.add_patient and the phone's sign-up button changes too. So a mobile
// key merges only into its own area's keys (--scope) or a shallow common.* key.
const shallowCommon = (k) => k.startsWith("common.") && k.split(".").length <= 3;
const inScope = (k) => shallowCommon(k) || scope.some((p) => k.startsWith(p));
const leaf = (k) => k.split(/[.:]/).pop();
const ranker = (mobileKey) => (a, b) =>
  (leaf(b) === leaf(mobileKey)) - (leaf(a) === leaf(mobileKey)) ||
  shallowCommon(b) - shallowCommon(a) ||
  a.length - b.length ||
  a.localeCompare(b);

const rows = [];
for (const [base, forms] of mobileFamilies) {
  if (area && !base.startsWith(area)) continue;
  const rank = ranker(base);
  const twins = webByEn.get(signature(mobile.en, base, forms)) ?? [];
  const candidates = twins.filter(inScope);
  if (!candidates.length) {
    rows.push({ mobile: base, forms, match: "none", web: [], outOfScope: twins.sort(rank) });
    continue;
  }
  const agrees = (w) => ["pt", "es"].every((l) => signature(mobile[l], base, forms) === signature(web[l], w, forms));
  const all = candidates.filter(agrees).sort(rank);
  const value = (tree, key) => forms.map((f) => tree[key + f]).join(" / ");
  rows.push({
    mobile: base,
    forms,
    match: all.length ? "all" : "drift",
    target: all[0] ?? null,
    web: (all.length ? all : [...candidates].sort(rank)),
    en: value(mobile.en, base),
    pt: { mobile: value(mobile.pt, base), web: value(web.pt, [...candidates].sort(rank)[0]) },
    es: { mobile: value(mobile.es, base), web: value(web.es, [...candidates].sort(rank)[0]) },
  });
}

const count = (m) => rows.filter((r) => r.match === m).length;
if (args.includes("--markdown")) {
  const cell = (s) => String(s).replaceAll("|", "\\|");
  console.log("| # | Mobile key | Web key | en | pt mobile | pt web | es mobile | es web |\n|---|---|---|---|---|---|---|---|");
  rows
    .filter((r) => r.match === "drift")
    .forEach((r, i) =>
      console.log(
        `| ${i + 1} | \`${r.mobile}\` | \`${r.web[0]}\` | ${cell(r.en)} | ${cell(r.pt.mobile)} | ${cell(r.pt.web)} | ${cell(r.es.mobile)} | ${cell(r.es.web)} |`,
      ),
    );
} else {
  writeFileSync(join(root, "twins.json"), JSON.stringify(rows, null, 2));
  console.log(
    `mobile families ${rows.length}: ${count("all")} match a web key in en, pt and es, ` +
      `${count("drift")} match in en only, ${count("none")} have no web twin. Wrote twins.json.`,
  );
}
