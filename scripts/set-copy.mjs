// Sets web keys to new wording in every language, from a JSON file of
// { "key": { "en": "...", "pt": "...", "es": "..." } }. Keys use the fold's
// canonical form (settings.companion.title, common.save). Fails on a key that
// does not exist, so a rewrite never adds a key by accident.
//
//   node scripts/set-copy.mjs scripts/copy/notifications.json
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LANGS, root, webLocation } from "./trees.mjs";

const edits = JSON.parse(readFileSync(process.argv[2], "utf8"));
for (const lang of LANGS) {
  const cache = {};
  for (const [key, values] of Object.entries(edits)) {
    const { file, path } = webLocation(key);
    const full = join(root, "locales", lang, file);
    const tree = (cache[full] ??= JSON.parse(readFileSync(full, "utf8")));
    const parent = path.slice(0, -1).reduce((node, part) => node?.[part], tree);
    if (!parent || typeof parent[path.at(-1)] !== "string") throw new Error(`${lang}: ${key} is not a string in ${file}`);
    if (typeof values[lang] !== "string") throw new Error(`${key}: no ${lang} wording`);
    parent[path.at(-1)] = values[lang];
  }
  for (const [file, data] of Object.entries(cache)) writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
console.log(`set ${Object.keys(edits).length} keys in ${LANGS.length} languages`);
