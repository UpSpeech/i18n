// The web and mobile key trees, flattened to the keys each client calls.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLocale, ALIASES } from "../build-locale.js";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const LANGS = ["en", "pt", "es"];
const read = (path) => JSON.parse(readFileSync(path, "utf8"));

export const flatten = (obj, prefix = "", acc = {}) => {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    v && typeof v === "object" ? flatten(v, key, acc) : (acc[key] = v);
  }
  return acc;
};

function webFiles(lang) {
  const dir = join(root, "locales", lang);
  const files = {};
  for (const f of readdirSync(dir)) if (f.endsWith(".json")) files[f.slice(0, -5)] = read(join(dir, f));
  return files;
}

// common.json's subtrees sit at the root of the fold too, and app-frontend
// always calls them there (t("settings.companion.title")), so that is their
// canonical form. Its leaves keep the common. prefix.
export function webKeys(lang) {
  const files = webFiles(lang);
  const { translation } = buildLocale(files);
  const keys = {};
  for (const [top, value] of Object.entries(translation)) {
    if (ALIASES.includes(top) || !(value && typeof value === "object")) continue;
    if (top === "common") {
      for (const [k, v] of Object.entries(value)) if (typeof v === "string") keys[`common.${k}`] = v;
      continue;
    }
    flatten(value, top, keys);
  }
  return keys;
}

// The key as app-mobile calls it: common.json under the default namespace,
// quiz.json nested as quiz.*, auth.json (while it exists) under auth:.
export function mobileKeys(lang) {
  const dir = join(root, "locales", "mobile", lang);
  const file = (name) => (existsSync(join(dir, name)) ? read(join(dir, name)) : {});
  const auth = flatten(file("auth.json"));
  return {
    ...flatten(file("common.json")),
    ...flatten(file("quiz.json"), "quiz"),
    ...Object.fromEntries(Object.entries(auth).map(([k, v]) => [`auth:${k}`, v])),
  };
}

// The fold's top-level names that sit inside a file rather than at its root.
const NESTED = { onboarding: ["onboarding", "onboarding"], users: ["users", "users"], clients: ["users", "clients"], tenant: ["tenant", "tenant"], tenants: ["tenant", "tenants"] };

export function webLocation(key) {
  const [top, ...rest] = key.split(".");
  if (ALIASES.includes(top)) throw new Error(`${key}: use the canonical path, not the ${top} alias`);
  if (NESTED[top]) {
    const [file, ...prefix] = NESTED[top];
    return { file: `${file}.json`, path: [...prefix, ...rest] };
  }
  if (existsSync(join(root, "locales", "en", `${top}.json`))) return { file: `${top}.json`, path: rest };
  return { file: "common.json", path: [top, ...rest] };
}

export function mobileLocation(key) {
  if (key.startsWith("auth:")) return { file: "auth.json", path: key.slice(5).split(".") };
  if (key.startsWith("quiz.")) return { file: "quiz.json", path: key.split(".").slice(1) };
  return { file: "common.json", path: key.split(".") };
}

// The common.json subtrees the fold leaves at the root. One whose name the fold
// reuses for a namespace, such as users, is shadowed there.
export function commonSubtrees() {
  const files = webFiles("en");
  const { translation } = buildLocale(files);
  return new Set(Object.keys(files.common).filter((k) => typeof files.common[k] === "object" && translation[k] === files.common[k]));
}
