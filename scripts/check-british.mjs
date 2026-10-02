// Fails if an English value uses an American spelling. British English is the
// house standard. Keys never change; only the value is read.
// practice is a noun and practise is the verb, so only verb patterns are listed.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = join(root, "locales");

const AMERICAN = [
  /organiz\w*/, /personaliz\w*/, /recogniz\w*/, /customiz\w*/, /prioritiz\w*/,
  /summariz\w*/, /categoriz\w*/, /optimiz\w*/, /finaliz\w*/, /authoriz\w*/,
  /visualiz\w*/, /minimiz\w*/, /maximiz\w*/, /realiz\w*/, /apologiz\w*/,
  /standardiz\w*/, /emphasiz\w*/, /normaliz\w*/, /analyz\w*/, /behavior\w*/,
  /favorit\w*/, /favor\b/, /honor\w*/, /neighbor\w*/, /center\b/, /centered/,
  /centers\b/, /program\b/, /programs\b/, /modeling/, /modeled/, /labeled/,
  /labeling/, /canceled/, /canceling/, /traveled/, /enrollment/, /catalog\b/,
  /practicing/, /practiced/, /(?:to|you|they|we|can|let's) practice\b/,
];
// Technical terms the decision keeps, and a noun use the verb pattern catches.
const EXEMPT = /anonymiz|pseudonymiz|desensitiz|back to practice|dedication to practice/i;

const walk = (obj, prefix = "", acc = []) => {
  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") walk(value, path, acc);
    else if (typeof value === "string") acc.push([path, value]);
  }
  return acc;
};

const dirs = [join(localesDir, "en"), join(localesDir, "mobile", "en")];
let failures = 0;
for (const dir of dirs) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const entries = walk(JSON.parse(readFileSync(join(dir, file), "utf8")));
    for (const [key, value] of entries) {
      if (EXEMPT.test(value)) continue;
      for (const re of AMERICAN) {
        const hit = value.match(new RegExp(`\\b(${re.source})`, "i"));
        if (hit) {
          console.error(`${dir.slice(root.length + 1)}/${file}: ${key}: ${hit[1]}`);
          failures++;
        }
      }
    }
  }
}

if (failures) {
  console.error(`${failures} American spelling(s) in English values`);
  process.exit(1);
}
console.log("check-british: ok");
