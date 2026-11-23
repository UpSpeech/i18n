// Fails if a file comes back under locales/mobile/. Both clients read the
// namespace files in locales/<lang>/ through build-locale.js, so a mobile-only
// copy of a string is the duplicate plan 540 removed.
import { existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "locales", "mobile");
const files = existsSync(dir) ? readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".json")) : [];
if (files.length) {
  console.error(`locales/mobile has ${files.length} file(s): ${files.join(", ")}. Put the keys in locales/<lang>/ instead.`);
  process.exit(1);
}
console.log("no-mobile: ok");
