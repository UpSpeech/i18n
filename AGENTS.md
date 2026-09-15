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

The full text is `AGENTS.md` in the umbrella repo, `UpSpeech/upspeech`, which is
the single copy. These are the ones that cause damage if missed, so they are
repeated here.

- **Base branch: `main`.** Merging to `main` publishes. Both clients pin a tag, so a change is invisible until the tag is cut and the pin bumped in app-frontend and app-mobile.
- **Use a per-task worktree.** `git worktree add ../i18n-<slug> -b <branch> origin/main`.
  Never `git switch` in this checkout: other sessions run against it and a branch
  change reverts their uncommitted work.
- **Stage files by name.** Never `git add -A` or `git add .`, and never stage
  `.env`, credentials or keys.
- **No tool attribution.** No `Co-Authored-By`, no "Generated with", no assistant
  or vendor name in a commit, a PR body or a trailer.
- **No em dashes.** Anywhere. Use a comma or end the sentence.
- **A PR for a numbered plan opens with the plan and its issue**, on the first
  line, using the cross-repo form:

  ```
  **Plan**: [NNN, Title](https://github.com/UpSpeech/upspeech/blob/main/plans/NNN-slug.md), stage N of M. Tracking issue: UpSpeech/upspeech#ISSUE.
  ```

  A bare `#ISSUE` resolves in this repo and points at something else. Never write
  `Closes` on it: GitHub does not auto-close across repositories.
- **Comments are rare and short.** No comment restating the line below it, none
  longer than the code it describes, no tombstones for deleted code, no plan
  numbers or dates. Default to none.


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
