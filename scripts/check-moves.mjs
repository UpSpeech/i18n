// Fails if a move map names a web key that does not exist in every language,
// which would leave the phone showing a raw key once it reads that map.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLocale } from "../build-locale.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const movesDir = join(root, "scripts", "moves");
const maps = existsSync(movesDir) ? readdirSync(movesDir).filter((f) => f.endsWith(".json")) : [];
const FORMS = ["", "_one", "_other", "_he", "_she"];
let failed = false;

for (const lang of ["en", "es", "pt"]) {
  const dir = join(root, "locales", lang);
  const files = {};
  for (const f of readdirSync(dir)) if (f.endsWith(".json")) files[f.slice(0, -5)] = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const { translation } = buildLocale(files);
  const get = (key) => key.split(".").reduce((node, part) => node?.[part], translation);
  for (const file of maps) {
    for (const [from, value] of Object.entries(JSON.parse(readFileSync(join(movesDir, file), "utf8")))) {
      if (from.endsWith("*")) continue;
      const to = typeof value === "string" ? value : value.to;
      if (!FORMS.some((form) => { const v = get(to + form); return v !== undefined && (typeof v !== "object" || v === null); })) {
        console.error(`${lang}: moves/${file} sends ${from} to ${to}, which is not there`);
        failed = true;
      }
    }
  }
}

if (failed) process.exit(1);
console.log(`moves: ok (${maps.length} map${maps.length === 1 ? "" : "s"})`);
