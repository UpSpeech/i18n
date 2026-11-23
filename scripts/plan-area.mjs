// Builds one area's move map for move-mobile-keys.mjs and app-mobile's
// i18n-migrate.mjs, and prints what a person has to decide.
//
//   node scripts/plan-area.mjs <area> --prefixes companion_,biometric_ --scope settings.,common.
//        [--parent biometric_=settings.biometric] [--dynamic companion_style_,theme_]
//        [--picks picks.json]
//
// --prefixes  mobile keys in the area
// --scope     web keys an area key may merge into, besides shallow common keys
// --parent    where a phone-only key with that prefix goes; the rest of the key is its leaf
// --dynamic   prefixes the app builds keys from (t(`theme_${x}`)); each moves whole, under
//             its parent, so the template only swaps its prefix
// --picks     { mobileKey: "web" | "phone" | "separate" } for keys whose pt or es differ
//
// A phone-only key without a --parent goes where its siblings' web twins already
// are: first_run_patient_x lands beside onboarding.first_run.patient.* when most
// first_run_patient_ keys have a twin there.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { LANGS, mobileKeys, root, webKeys } from "./trees.mjs";
import { commonSubtrees } from "./trees.mjs";
import { baseOf } from "./forms.mjs";

const [area, ...rest] = process.argv.slice(2);
const opt = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : "");
const list = (name) => opt(name).split(",").filter(Boolean);
if (!area || !opt("--prefixes")) {
  console.error("usage: plan-area.mjs <area> --prefixes a_,b_ --scope x.,y. [--parent a_=x.a] [--dynamic a_b_] [--picks f.json]");
  process.exit(2);
}
const prefixes = list("--prefixes");
const scope = list("--scope");
const parents = Object.fromEntries(list("--parent").map((p) => p.split("=")));
const dynamic = list("--dynamic").sort((a, b) => b.length - a.length);
const picks = opt("--picks") ? JSON.parse(readFileSync(opt("--picks"), "utf8")) : {};

const web = Object.fromEntries(LANGS.map((l) => [l, webKeys(l)]));
const mobile = Object.fromEntries(LANGS.map((l) => [l, mobileKeys(l)]));

function families(keys) {
  const set = new Set(keys);
  const out = new Map();
  for (const key of keys) {
    const base = baseOf(key, (k) => set.has(k));
    if (!out.has(base)) out.set(base, []);
    out.get(base).push(key.slice(base.length));
  }
  return out;
}
const webFamilies = families(Object.keys(web.en));
const mobileFamilies = families(Object.keys(mobile.en));
const sig = (tree, base, forms) => forms.map((f) => `${f}=${tree[base + f]}`).sort().join("\n");
const sameIn = (lang, m, w, forms) => sig(mobile[lang], m, forms) === sig(web[lang], w, forms);

const byEn = new Map();
for (const [base, forms] of webFamilies) {
  const s = sig(web.en, base, forms);
  if (!byEn.has(s)) byEn.set(s, []);
  byEn.get(s).push(base);
}

const commonTops = commonSubtrees();
const shallowCommon = (k) => k.startsWith("common.") || (commonTops.has(k.split(".")[0]) && k.split(".").length <= 2);
const inScope = (k) => shallowCommon(k) || scope.some((p) => k.startsWith(p));
const leaf = (k) => k.split(/[.:]/).pop();
const rank = (m) => (a, b) =>
  (leaf(b) === leaf(m)) - (leaf(a) === leaf(m)) || shallowCommon(b) - shallowCommon(a) || a.length - b.length || a.localeCompare(b);

// Learned from every mobile key whose English has a web twin: the mobile
// prefix in front of the twin's leaf, and the web parent the twin sits under.
const votes = {};
for (const [base, forms] of mobileFamilies) {
  for (const w of byEn.get(sig(mobile.en, base, forms)) ?? []) {
    const flat = base.replace(/\./g, "_");
    const wLeaf = w.split(".").pop();
    if (!flat.endsWith(`_${wLeaf}`)) continue;
    const pre = flat.slice(0, -wLeaf.length);
    const par = w.split(".").slice(0, -1).join(".");
    (votes[pre] ??= {})[par] = (votes[pre][par] ?? 0) + 1;
  }
}
const learned = Object.entries(votes)
  .map(([pre, ps]) => [pre, ...Object.entries(ps).sort((a, b) => b[1] - a[1])[0]])
  .filter(([, , n]) => n >= 2)
  .sort((a, b) => b[0].length - a[0].length);

function placement(key) {
  const flat = key.replace(/\./g, "_");
  const explicit = Object.keys(parents).sort((a, b) => b.length - a.length).find((p) => flat.startsWith(p));
  if (explicit) return `${parents[explicit]}.${key.slice(explicit.length)}`;
  const rule = learned.find(([pre]) => flat.startsWith(pre));
  return rule ? `${rule[1]}.${key.slice(rule[0].length)}` : null;
}

const map = {};
const drift = [];
const unplaced = [];
const clashes = [];
const templates = {};
const inArea = [...mobileFamilies].filter(([base]) => prefixes.some((p) => base.startsWith(p)));

for (const [base, forms] of inArea) {
  const dyn = dynamic.find((d) => base.startsWith(d));
  if (dyn) {
    const parent = parents[dyn] ?? placement(dyn + "x")?.slice(0, -2);
    if (!parent) {
      unplaced.push(`${base} (template ${dyn}*)`);
      continue;
    }
    templates[`${dyn}*`] = `${parent}.*`;
    map[base] = `${parent}.${base.slice(dyn.length)}`;
    continue;
  }
  // Same English is only a candidate. A twin counts when it sits where the key
  // would be placed, beside it, or is a shallow common key: "Original" for a
  // mouth is not the crowns' "Original".
  const home = placement(base);
  const homeParent = home?.split(".").slice(0, -1).join(".");
  const near = (w) => w === home || (homeParent && w.startsWith(`${homeParent}.`)) || shallowCommon(w);
  const order = (a, b) => (b === home) - (a === home) || rank(base)(a, b);
  const twins = (byEn.get(sig(mobile.en, base, forms)) ?? []).filter((w) => inScope(w) && (!home || near(w))).sort(order);
  const agreeing = twins.filter((w) => sameIn("pt", base, w, forms) && sameIn("es", base, w, forms));
  if (agreeing.length) {
    map[base] = agreeing[0];
    continue;
  }
  const pick = picks[base];
  if (twins.length && pick !== "separate") {
    if (pick === "web") map[base] = twins[0];
    else if (pick === "phone") map[base] = { to: twins[0], keep: "phone" };
    else drift.push({ base, forms, twin: twins[0] });
    continue;
  }
  const to = placement(base);
  if (!to) {
    unplaced.push(base);
    continue;
  }
  // A placement can land on a web key that already says something else.
  const taken = forms.some((f) => web.en[to + f] !== undefined);
  if (!taken) map[base] = to;
  else if (pick === "web") map[base] = to;
  else if (pick === "phone") map[base] = { to, keep: "phone" };
  else if (pick === "separate") map[base] = `${to.split(".").slice(0, -1).join(".")}.${base}`;
  else drift.push({ base, forms, twin: to });
}

// A new key must not land on a web key that says something else, or on a path
// where one side is a string and the other an object.
const webPaths = new Set(Object.keys(web.en));
for (const [from, value] of Object.entries(map)) {
  const to = typeof value === "string" ? value : value.to;
  const forms = mobileFamilies.get(from);
  const exists = forms.some((f) => webPaths.has(to + f));
  if (exists && !LANGS.every((l) => sig(mobile[l], from, forms) === sig(web[l], to, forms)) && typeof value === "string" && !agreesOrPicked(from)) {
    clashes.push(`${from} -> ${to}: that web key says "${web.en[to + forms[0]]}"`);
  }
  const prefixClash = [...webPaths].some((p) => p.startsWith(`${to}.`)) || to.split(".").some((_, i, parts) => i && webPaths.has(parts.slice(0, i).join(".")));
  if (prefixClash) clashes.push(`${from} -> ${to}: a web key is already a string or an object on that path`);
}
function agreesOrPicked(from) {
  return picks[from] === "web" || picks[from] === "phone";
}

const counts = Object.values(map).reduce(
  (acc, to) => {
    const target = typeof to === "string" ? to : to.to;
    acc[webPaths.has(target) || [...webFamilies.keys()].includes(target) ? "merge" : "new"]++;
    return acc;
  },
  { merge: 0, new: 0 },
);
mkdirSync(join(root, "scripts", "moves"), { recursive: true });
const out = join(root, "scripts", "moves", `${area}.json`);
writeFileSync(out, `${JSON.stringify({ ...map, ...Object.fromEntries(Object.entries(templates)) }, null, 2)}\n`);

console.log(`${area}: ${inArea.length} families. ${counts.merge} merge into a web key, ${counts.new} are new web keys, ` +
  `${drift.length} need a pick, ${unplaced.length} have no place, ${clashes.length} clash. Wrote scripts/moves/${area}.json.`);
if (Object.keys(templates).length) console.log(`\nTemplates:\n${Object.entries(templates).map(([a, b]) => `  ${a} -> ${b}`).join("\n")}`);
if (drift.length) {
  const cell = (s) => String(s ?? "").replaceAll("|", "\\|");
  const v = (tree, k, forms) => forms.map((f) => tree[k + f]).join(" / ");
  console.log("\n| # | Phone key | Web key | en | pt phone | pt web | es phone | es web |\n|---|---|---|---|---|---|---|---|");
  drift.forEach((d, i) =>
    console.log(`| ${i + 1} | \`${d.base}\` | \`${d.twin}\` | ${cell(v(mobile.en, d.base, d.forms))} | ${cell(v(mobile.pt, d.base, d.forms))} | ${cell(v(web.pt, d.twin, d.forms))} | ${cell(v(mobile.es, d.base, d.forms))} | ${cell(v(web.es, d.twin, d.forms))} |`),
  );
}
if (unplaced.length) console.log(`\nNo place (add a --parent):\n${unplaced.map((u) => `  ${u}`).join("\n")}`);
if (clashes.length) console.log(`\nClashes:\n${clashes.map((c) => `  ${c}`).join("\n")}`);
if (unplaced.length || clashes.length) process.exitCode = 1;
