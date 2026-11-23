// Fails if the fold in build-locale.js points at a file or a subtree that no
// longer exists, which would leave a whole section of keys undefined in both clients.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLocale } from "../build-locale.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = false;

for (const lang of ["en", "es", "pt"]) {
  const dir = join(root, "locales", lang);
  const files = {};
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".json")) files[f.slice(0, -5)] = JSON.parse(readFileSync(join(dir, f), "utf8"));
  }
  let built;
  try {
    built = buildLocale(files);
  } catch (error) {
    console.error(`${lang}: buildLocale threw: ${error.message}`);
    failed = true;
    continue;
  }
  const sections = { impersonation: built.impersonation, ...built.translation };
  for (const [name, value] of Object.entries(sections)) {
    if (value === undefined) {
      console.error(`${lang}: ${name} is undefined`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("build-locale: ok");
