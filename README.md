# @upspeech/i18n

Shared i18next translation files (en / es / pt) for the UpSpeech **frontend** and **mobile**
apps. Single source of truth so a copy change is made once, not duplicated across repos.

Consumed as a **public git dependency** (GitHub Packages is blocked by the org billing cap, and
translation strings ship in the client bundle anyway so they aren't secret). No registry, no auth:

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
  en/  es/  pt/        frontend namespaces (one JSON per namespace)
  mobile/
    en/ es/ pt/        the mobile app's own files (common.json, auth.json, quiz.json)
scripts/
  check-parity.mjs     fails if a key exists in one language but not another
```

The package ships the raw JSON only. Each app imports the files it needs by subpath and builds
its own i18next `resources` (the two apps use different key schemes), so there is no build step
and no bundled entrypoint.

## Usage

```ts
// frontend
import enCommon from "@upspeech/i18n/locales/en/common.json";
// mobile
import enCommon from "@upspeech/i18n/locales/mobile/en/common.json";
```

## Editing copy

1. Edit the relevant `locales/<lang>/<namespace>.json` (frontend) or
   `locales/mobile/<lang>/<namespace>.json` (mobile).
2. Keep all three languages in sync, `npm run check` enforces it (and runs in CI on every PR).
3. Bump the git tag (`git tag vX.Y.Z && git push --tags`).
4. Bump the `#vX.Y.Z` ref in each consuming app's `package.json` to pick it up.

For tight local iteration, `npm link` this repo into the consuming app instead of bumping the tag
on every edit.
