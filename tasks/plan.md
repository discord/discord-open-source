# Implementation Plan: Reliable Open Source Community Directory

## Overview

Make the repository safe to maintain and submit as a focused modernization of the existing Discord open-source community data source. The first release will preserve the public JSON contract while making validation deterministic for pull requests, resilient for scheduled live checks, and easier for contributors to understand.

## Architecture Decisions

- Keep `communities.json` as the public data contract so downstream Discord consumers are not broken.
- Separate deterministic structural validation from live Discord invite validation. Pull requests must not fail because Discord is rate-limited or unavailable; scheduled checks will still detect broken invites.
- Use Node.js built-ins wherever practical and commit a lockfile, reducing dependency and supply-chain surface area.
- Treat existing community data as user-maintained content: do not silently rewrite entries or invent licensing/ownership claims.

## Task List

### Phase 1: Validation foundation

- [x] Task 1: Refactor validation into deterministic structural checks and optional resilient live checks.
- [x] Task 2: Add focused tests for malformed records, duplicate entries, URL safety, logo references, and network failure handling.

### Checkpoint: Foundation

- [x] Offline validation passes against all existing data.
- [x] Focused tests pass without network access.

### Phase 2: Maintenance and CI

- [x] Task 3: Remove unnecessary runtime dependencies, update scripts, and commit a lockfile.
- [x] Task 4: Modernize GitHub Actions and make pull-request checks deterministic while retaining scheduled live verification.

### Checkpoint: Maintenance

- [x] Pull requests run without Discord API access.
- [x] Scheduled validation has explicit timeout, retry, and rate-limit behavior.

### Phase 3: Contributor readiness

- [x] Task 5: Rewrite contributor documentation with local commands, data rules, and troubleshooting guidance.
- [x] Task 6: Add repository hygiene files and perform a final data/format/security review.

### Checkpoint: Complete

- [x] All tests and formatting checks pass.
- [x] Working tree contains only intentional, reviewable changes.
- [x] Changes are ready to commit to a fork and submit as a pull request.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live Discord API instability | High | Keep online checks separate from PR checks; add timeout and bounded retries. |
| Breaking the downstream JSON shape | High | Preserve `data` and existing fields; test the top-level contract. |
| Invalid or unsafe URLs | Medium | Validate URL schemes and reject malformed records before network access. |
| Over-expanding the change | Medium | Defer website/UI work; keep this release focused on data reliability and maintenance. |

## Open Questions

- The fork's final name and GitHub owner must be chosen before creating the remote fork.
- A license should be added only after confirming the intended rights for the existing Discord-curated content.
