# @upspeech/i18n

Shared i18next translation files (en / es / pt) for the UpSpeech **frontend** and **mobile**
apps. Single source of truth so a copy change is made once, not duplicated across repos.

Consumed as a **public git dependency** pinned to a release tag (translation strings ship in the
client bundle anyway, so they aren't secret). No registry, no auth:

```jsonc
// app-frontend & app-mobile package.json
"@upspeech/i18n": "git+https://github.com/UpSpeech/i18n.git#v0.3.0"
```

> Backend (Rails) translations are intentionally **not** here. They are server-owned
> (mailers, Devise, validation, PDFs, push) and live in `app-backend/config/locales`, with their
> own parity check at `app-backend/bin/i18n_parity`.

## Layout

```
locales/
  en/  es/  pt/        one JSON per namespace, read by both apps
build-locale.js        folds one language's namespace files into the "translation" namespace
scripts/
  check-parity.mjs     fails if a key exists in one language but not another
  check-placeholders.mjs  fails if a key's {{placeholders}} differ between languages;
                       placeholder-allowlist.json lists the deliberate differences
  check-build-locale.mjs  fails if the fold points at a file or subtree that is gone
  check-moves.mjs      fails if a move map in scripts/moves/ names a key that is gone
  check-no-mobile.mjs  fails if a file appears under locales/mobile/
  plan-area.mjs, move-mobile-keys.mjs, twins.mjs, areas.sh
                       how plan 540 moved the phone's old keys here; scripts/moves/ is the record
```

The package ships raw JSON plus `build-locale.js`, plain JavaScript, so there is no build step.
Both apps fold the namespaces with it, so a key is called the same on web and on the phone.

## Usage

```ts
import { buildLocale } from "@upspeech/i18n/build-locale";
import enCommon from "@upspeech/i18n/locales/en/common.json";
```

## Editing copy

1. Edit the relevant `locales/<lang>/<namespace>.json`. Both apps read it.
2. Keep all three languages in sync, `npm run check` enforces it (and runs in CI on every PR).
3. Bump the git tag (`git tag vX.Y.Z && git push --tags`). The tag is the version. The
   `version` in this repo's `package.json` is not kept in step and only matters to the dormant,
   manual-only `publish.yml`.
4. Bump the `#vX.Y.Z` ref in each consuming app's `package.json` to pick it up.

For tight local iteration, `npm link` this repo into the consuming app instead of bumping the tag
on every edit.
