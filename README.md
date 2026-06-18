# @upspeech/i18n

Shared i18next translation resources (en / es / pt) for the UpSpeech **frontend** and **mobile**
apps. Single source of truth so a copy change is made once, not duplicated across repos.

> Backend (Rails) translations are intentionally **not** here. They are server-owned
> (mailers, Devise, validation, PDFs, push) and live in `app-backend/config/locales`.

## Layout

```
locales/
  en/  es/  pt/        one JSON per namespace, mirrors the frontend's namespaces
  mobile/
    en.json es.json pt.json   strings used only by the mobile app (the "mobile" namespace)
scripts/
  build.mjs            inlines all JSON into dist/index.js (bundler-agnostic ESM)
  check-parity.mjs     fails if a key exists in one language but not another
```

## Usage

```bash
npm install @upspeech/i18n
```

```ts
import { resources, supportedLngs, namespaces } from "@upspeech/i18n";
import i18n from "i18next";

i18n.init({
  resources,        // { en: { common: {...}, ... }, es: {...}, pt: {...} }
  supportedLngs,
  fallbackLng: "en",
  defaultNS: "common",
  ns: namespaces,
});
```

Each app keeps its own i18next config (language detection, fallback). Only the resource
bundle is shared.

## Editing copy

1. Edit the relevant `locales/<lang>/<namespace>.json` (or `locales/mobile/<lang>.json`).
2. Keep all three languages in sync (`npm run check` enforces this).
3. Bump `version` in `package.json` and merge to `main`. CI publishes to GitHub Packages.
4. Consumers bump the dependency to pick it up.

For tight local iteration, `npm link` this repo into the consuming app instead of publishing
on every edit.

## Auth (GitHub Packages)

Publishing this repo's package uses the workflow's built-in `GITHUB_TOKEN`. **Consuming** the
package (frontend, mobile, Docker, Railway, EAS, local) needs a token with `read:packages`
exposed as `NODE_AUTH_TOKEN`, plus this `.npmrc`:

```
@upspeech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```
