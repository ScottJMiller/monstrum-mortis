# Phase D — completed release acceptance

**Complete — 17 October 2026 UTC (16 October EDT).** The user accepted human-testing items 1–4, reported the final Node 24 checks passed, supplied Cloudflare usage and two-device logs, and authorized final release housekeeping. This record closes item 5 after reconciling the candidate and documentation. Step 6 and Battle v2 Phases A–D are complete for the accepted scope. No further feature phase or deployment is authorized by this closure.

## Accepted release identity

| Evidence | Identity |
| --- | --- |
| Implementation source commit | `97f0cb34d861aef585fb6d84b0f90364f72c22df` |
| Deployed Worker version | `f4813c32-185e-4a6a-b74a-1a508c76aadc` |
| Public origin | https://monstrum-mortis.scott-jeffrey-miller.workers.dev |
| Published main bundle | `/assets/index-DeMqWIJu.js` |
| Main bundle SHA-256 | `cbb82b2dd7b23d64e48f09d09ebfef39cdc176a57608a30b8450acbbd5f6ec34` |
| Final local output fingerprint | `ad5ac614aad5a115672f505259b59717a4b663101e1d6e3fd7cf9f9a05708f4d` |
| Runtime contract | Room JSON 7 / protocol 6 / rules 0.6.0; DNA 0.2.0 / combat 0.3.0; presentation battle-v2-b2 |

[Publication evidence](battle-v2-phase-d-review/player-name/deployed-evidence.json) verifies the served HTML/main bundle and health on 16 October; [final inventory](battle-v2-phase-d-review/assets.json), recorded 23:59:16 UTC, identifies the local output. The later [live capture](battle-v2-phase-d-review/log-review/summary.json) identifies that same Worker version. Application source, dependencies and runtime assets match the implementation commit at closeout; the pending housekeeping commit records documentation, retained test evidence and the user's observability configuration. It does not change gameplay or publish a new Worker. Whole-tree asset fingerprints are offline build identities, not a claim that every CDN file was fetched in the deployed smoke.

## Completion record

- [x] **Human items 1–4:** user acceptance covers iPhone/iPad Safari and Linux Chrome device fixes, complete three-round multiplayer/timing/solo continuation, interruptions/recovery, accessibility and performance. This is user acceptance; no agent-run physical tests, device model/OS inventory or numerical hardware benchmark is invented.
- [x] **Final local checks:** user reported all five Node 24 commands below passed with the committed lockfile. Earlier agent-run checks remain separately dated in the [implementation history](archive/release-closeout-2026-10-17/IMPLEMENTATION-STATUS.md). New totals/stdout are not inferred from that report.
- [x] **Account usage and diagnostics:** supplied quota reports and the inspected live capture support the demonstrated small testing volume. No confirmed server exception/resource failure/gameplay defect was found in that capture.
- [x] **Candidate identity:** source commit, published version/main bundle and final local fingerprint are recorded above, with their individual evidence scopes.
- [x] **Documentation:** current rules/status/architecture/specification/handoff agree; completed Phase C/D guidance is [archived](archive/release-closeout-2026-10-17/README.md). Historical checks and original provenance remain available.

```sh
npm run test:phase-d-local
npm run test:composition
npm run simulate:combat
npm run test:audio-lettering
npm run test:viewport-scroll
```

`test:phase-d-local` includes configuration/types/unit checks, production build/Worker dry run, current room/DNA/browser regressions, production asset guards and offline byte inventory. These commands do not deploy or generate production load. Review artifacts include the [simplification contact sheet](battle-v2-phase-d-review/simplification/contact-sheet.png), [audio/lettering evidence](battle-v2-phase-d-review/audio-lettering-fix/README.md), [touch/viewport evidence](battle-v2-phase-d-review/viewport-scroll-fix/README.md) and [remembered-name browser checks](battle-v2-phase-d-review/player-name/production-flow/browser-evidence.json).

## Housekeeping checks actually run

On Node **24.21.0**, `npm run check` and `npm run build` passed. A separate `node --test --test-isolation=none tests/*.test.ts` run passed **232 tests**. `node scripts/check-battle-v2-build.mjs` passed required-asset hash and production-exclusion checks (107 required runtime files / 249 production files), specimen/font/frame provenance checks and the retained reservoir derivative check. Checking a shipped legacy derivative does not imply the retired reservoir UI is active.

The rebuilt output fingerprint exactly matches the retained final inventory, and the main bundle hash matches publication evidence. Relative documentation file/heading links, changed/new JSON parsing and `git diff --check` passed. No application source/dependency/runtime-asset diff exists against the implementation commit. Slow runtime/browser/physical suites were not repeated for this documentation closeout; their accepted results remain attributed above. No deployed requests, production load, account change or publication was performed during housekeeping.

## Cloudflare usage and log findings

The user supplied three namespace PDF reports (30-day views), plus a separate account summary for **October 17 only**. The original PDFs/log exports remain outside the repository; the log review retains sanitized findings and input hashes. Values below are reported observations, not direct agent account access.

| Namespace, 30-day window | Requests | Duration (GB-s) | SQL rows read | SQL rows written |
| --- | ---: | ---: | ---: | ---: |
| GuestLease | ~8k | 52.88 | ~11k | ~2k |
| LaboratoryRoom | ~5k | 80.89 | ~26k | ~13k |
| MatchmakingPool | ~2k | 12.42 | ~9k | ~3k |
| Combined | ~15k | 146.19 | ~46k | ~18k |

The one-day account summary reports **0.034 GB-s, 5 requests, 20 rows read, 8 rows written, 1.89 MB total SQL storage**, zero KV storage/operations. The earlier Worker October 1–17 summary reports ~1.5k requests and 1.76k ms total CPU. Different windows and request categories are not interchangeable. At the reported usage, the observed duration/rows are below even one day's Durable Objects Free allowances: 13k GB-s, 5M reads and 100k writes; storage is below 5 GB. This is headroom for demonstrated use, not a sustained capacity estimate. See [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) and [Worker limits](https://developers.cloudflare.com/workers/platform/limits/).

The [sanitized live-log review](battle-v2-phase-d-review/log-review/README.md) covers **one 120-record sample**, 01:11:01.672–01:13:00.280 UTC on 17 October: 101 ok, 17 canceled, two disconnected streams, zero exceptions/resource-exhaustion outcomes. All 19 WebSocket message/close handlers completed ok. No confirmed defect was identified; individual cancellation causes and one abnormal socket close cannot all be diagnosed from invocation metadata.

## Retained limitations and operation

- Historical error-card totals differ from their visible breakdowns by eight. This remains an unexplained reporting discrepancy, not eight identified bugs; the newer capture does not reconstruct those earlier events.
- No synthetic production load, maximum-player-capacity guarantee, exhaustive browser/device matrix or supplied numerical cold/warm/memory benchmark is claimed. Future sustained load needs current account-wide Free headroom and a bounded approved plan.
- `fullReleaseAvailable` remains **false** in the existing health contract. Human acceptance is recorded here; this documentation closure does not toggle runtime capability flags. Gameplay/mechanics/combat/presentation flags remain true. Health alone proves neither storage nor multiplayer.
- Preserve Workers Free, SQLite identities/bindings, workers.dev-only routing and the user's self-hosted domains. The user's enabled invocation logging remains in `wrangler.json`; raw headers/credentials are not committed.
- No deployment or commit was performed for housekeeping. A docs/evidence-only update with logging settings already applied in the dashboard requires no repeat deployment. Future source/config changes must be checked and publication explicitly authorized.
