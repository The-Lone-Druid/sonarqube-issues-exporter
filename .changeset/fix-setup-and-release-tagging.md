---
'sonarqube-issues-exporter': patch
---

fix(setup): organization and project key prompts no longer cut off after token entry

The hidden token prompt left stdin paused after input, blocking the
readline interface from reading the Organization and Default Project Key
questions that follow. All setup prompts now complete correctly.

fix(release): git tags and GitHub Releases now created automatically on version bump

`changesets/action` requires a `publish` script to enter release mode.
Without one, merging the "Version Packages" PR created no tag and no
GitHub Release. Adding `pnpm changeset tag` as the publish command
restores automatic tag and release creation without triggering an npm
publish (which remains a manual step via `pnpm release`).
