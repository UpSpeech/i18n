const GENDER = new Set(["he", "she"]);
const PLURAL = new Set(["zero", "one", "two", "few", "many", "other"]);

// The family a key belongs to: "steps_one" and "steps_other" share "steps",
// "ready_she" shares "ready". A plural suffix only counts when its _one sibling
// exists, so a standalone "reason_other" (an "Other" option) is its own family.
export function baseOf(key, has) {
  let base = key;
  for (;;) {
    const match = base.match(/^(.+)_([a-z]+)$/);
    if (!match) return base;
    const [, stem, form] = match;
    if (GENDER.has(form) || (PLURAL.has(form) && has(`${stem}_one`))) base = stem;
    else return base;
  }
}
