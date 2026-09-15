# UpSpeech translations (i18n)

Shared translation catalogues for the web and mobile clients.

**This repo is public.** Nothing about product strategy, clinical positioning,
pricing or patient data goes in it, including in this file.

## Conventions

- **A key added for one client is added for both**, or the other renders the raw
  key. `scripts/check-parity.mjs` is the check.
- **Releases are tagged, and both clients pin the tag.** Landing on `main` is not
  shipping: bump the pin in app-frontend and app-mobile, in that order.
- **Mobile needs a flat namespace.** A web-first key shape does not reach mobile
  until it is flattened.
- Never translate the `pt:` block of the demo seed's `mini_games.yml`.

## Gates

```bash
node scripts/check-parity.mjs
```

## Workspace rules

`AGENTS.md` in the umbrella repo, `UpSpeech/upspeech`, is the single copy and
holds the rest: pull requests, screenshots, plans and the board, testing,
decisions. Read it before opening a PR from here.

Four rules sit here because they bite before you would think to go and look.

- **Base branch: `main`.** Merging to `main` publishes. Both clients pin a tag, so a change is invisible until the tag is cut and the pin bumped in app-frontend and app-mobile.
- **Work in a per-task worktree.** `git worktree add ../i18n-<slug> -b <branch> origin/main`.
  Other sessions run against this checkout, and a `git switch` here reverts their
  uncommitted work.
- **Stage files by name**, so `.env`, credentials and keys stay out of a commit.
- **A commit message carries the change and nothing else.** No trailer naming an
  assistant or a vendor, and no em dashes anywhere: use a comma, or end the
  sentence.

**Comments are rare and short.** Write one where the code cannot say it itself: a
non-obvious constraint, a workaround and what forces it, a unit or an invariant.
Default to none.

## Mobile is filed, not remembered

If a change alters something `app-mobile` consumes, a serializer, an endpoint, a
wire key, a status vocabulary, a feature flag or a translation key, then before
the PR opens one of these is true:

1. The mobile change is in the same batch, and the PR links it.
2. A plan exists with `repos: app-mobile`, its issue is filed, and the PR names it.
3. The change does not reach mobile, and the PR says so in one line.

`docs/Feature Parity.md` in the docs vault is the record of what each client has.
Update it in the same session when a feature lands on one client and not the
other. That is its own instruction, and its "Gaps as of" section is the live list.

**There is no automated web-versus-mobile parity gate at all.** `bin/i18n_parity`
is not one: it checks the Rails locale files in `app-backend/config/locales/`
against each other, which is server-side strings, and it never looks at either
client. The nearest thing is `scripts/check-parity.mjs` in the `i18n` repo, and
that only checks a key exists in every language. It cannot tell you a key added
for web reached mobile, because the two clients pin different tags of the
package. This rule is the whole mechanism.


## CI cannot enforce anything right now

Every GitHub Actions workflow in the organisation is failing to start:

> The job was not started because recent account payments have failed or your
> spending limit needs to be increased.

Jobs go red in a couple of seconds with zero steps executed. That is the billing
signature, not a test failure. Run the gates above locally and say in the PR that
you did. Delete this section when Actions runs again.
