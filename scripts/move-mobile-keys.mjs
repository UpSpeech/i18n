// Applies one area's move map: each mobile key family either merges into the
// web key it names (the web wording wins) or, when that web key does not exist
// yet, is copied there in every language. Then the mobile key is deleted.
//
//   node scripts/move-mobile-keys.mjs scripts/moves/auth.json
//
// A map is { "auth:sign_in_title": "auth.sign_in_title", "save": "common.save" }.
// Keys are the base of a family; _one, _he and the rest move with it.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ALIASES } from "../build-locale.js";
import { baseOf } from "./forms.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["en", "es", "pt"];
// The fold's top-level names that sit inside a file rather than at its root.
const NESTED = { onboarding: ["onboarding", "onboarding"], users: ["users", "users"], clients: ["users", "clients"], tenant: ["tenant", "tenant"], tenants: ["tenant", "tenants"] };

const map = JSON.parse(readFileSync(process.argv[2], "utf8"));
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const write = (file, data) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

function webLocation(key) {
  const [top, ...rest] = key.split(".");
  if (ALIASES.includes(top)) throw new Error(`${key}: use the canonical path, not the ${top} alias`);
  const [file, ...prefix] = NESTED[top] ?? [top];
  return { file: `${file}.json`, path: [...prefix, ...rest] };
}

function mobileLocation(key) {
  if (key.startsWith("auth:")) return { file: "auth.json", path: key.slice(5).split(".") };
  if (key.startsWith("quiz.")) return { file: "quiz.json", path: key.split(".").slice(1) };
  return { file: "common.json", path: key.split(".") };
}

const parentOf = (tree, path, create) =>
  path.slice(0, -1).reduce((node, part) => {
    if (node && create && node[part] === undefined) node[part] = {};
    return node?.[part];
  }, tree);

// The family's members: the leaf names beside the base that only add form suffixes.
function family(parent, leaf) {
  const names = Object.keys(parent ?? {});
  return names.filter((name) => baseOf(name, (k) => names.includes(k)) === leaf);
}

const changed = [];
for (const lang of LANGS) {
  const cache = {};
  const open = (dir, file) => {
    const full = join(root, "locales", dir, file);
    return (cache[full] ??= read(full));
  };
  for (const [mobileKey, webKey] of Object.entries(map)) {
    const m = mobileLocation(mobileKey);
    const w = webLocation(webKey);
    const mTree = open(join("mobile", lang), m.file);
    const wTree = open(lang, w.file);
    const mParent = parentOf(mTree, m.path, false);
    const mLeaf = m.path.at(-1);
    const members = family(mParent, mLeaf);
    if (!members.length) throw new Error(`${lang}: ${mobileKey} is not in locales/mobile/${lang}/${m.file}`);
    const wParent = parentOf(wTree, w.path, true);
    const wLeaf = w.path.at(-1);
    const existing = family(wParent, wLeaf);
    if (!existing.length) for (const name of members) wParent[wLeaf + name.slice(mLeaf.length)] = mParent[name];
    for (const name of members) {
      const now = wParent[wLeaf + name.slice(mLeaf.length)];
      if (now !== mParent[name]) changed.push(`${lang} ${mobileKey}${name.slice(mLeaf.length)}: "${mParent[name]}" -> "${now}"`);
    }
    for (const name of members) delete mParent[name];
    // Drop the parents this deletion emptied, so parity does not trip on them.
    for (let depth = m.path.length - 1; depth > 0; depth--) {
      const parent = parentOf(mTree, m.path.slice(0, depth + 1), false);
      if (!parent || Object.keys(parent).length) break;
      delete parentOf(mTree, m.path.slice(0, depth), false)[m.path[depth - 1]];
    }
  }
  for (const [file, data] of Object.entries(cache)) {
    if (Object.keys(data).length) write(file, data);
    else rmSync(file);
  }
}

console.log(`moved ${Object.keys(map).length} mobile key families`);
if (changed.length) console.log(`\nThe phone's wording changes for:\n${changed.map((c) => `  ${c}`).join("\n")}`);
