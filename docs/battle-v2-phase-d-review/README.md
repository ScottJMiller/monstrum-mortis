# Phase D evidence ledger — 15 October 2026

## Accepted release — 17 October 2026 UTC

Phase D is complete for the accepted scope. See [current status](../IMPLEMENTATION-STATUS.md), [completed acceptance](../BATTLE-V2-PHASE-D-ACCEPTANCE.md), [final browser evidence](simplification/browser-evidence.json), [contact sheet](simplification/contact-sheet.png) and [sanitized deployed-log review](log-review/README.md). Human testing is user-accepted, the final Node 24 commands are user-reported passing, and actual quota/log inputs are recorded with their windows and limitations. Baseline/private/queue/display/load/LAN results below remain dated history; their open items do not reopen acceptance. The previous asset inventory is [archived](../archive/pre-simplification-2026-10-16/phase-d-assets.json).

## Historical pre-simplification baseline

Phase D started after the user indicated readiness. The user can test iPhone Safari/Opera/Chrome, iPad Safari/Chrome and Linux Chrome. The initial matrix selects iPhone Safari, iPad Safari and Linux Chrome. **At this historical baseline, no physical-device run or human acceptance had been recorded.** [Acceptance checklist](../BATTLE-V2-PHASE-D-ACCEPTANCE.md).

## Historical local checks — 15 October

- `npm run check`: configuration, both TypeScript projects, 16 unit test files passed. The 225 individual tests were last separately enumerated in the accepted refinement record; this phase's normal test runner reports files.
- `npm run build`: passed; production media/exclusion guard passed, 249 built files, 107 reviewed battle assets plus existing specimen/font/frame/reservoir hash checks. No fixture galleries, source masters or debug controls shipped.
- `npm run deploy:dry`: passed; upload 166.74KiB / gzip 39.19KiB, unchanged ASSETS / ROOMS / MATCHMAKING / GUEST_LEASES and SQLite classes. A local bundle dry run, not deployed/account evidence.
- `node scripts/measure-phase-d-assets.mjs`: passed. [Initial pre-fix inventory](pre-lan-fix-assets.json), fingerprint `fd8eb832be78db6dd65653ad3563ce3bfff35afa239d58b28ec3cd44180ad27f`. Entire built tree 9,753,359 bytes, main JS 362,811 bytes, CSS 33,990 bytes. All body sets stay below the existing 600,000-byte review target and arenas below 400,000 bytes. This is not initial network payload or browser/GPU memory.
- `node tests/phase-d-load.runtime.mjs`: all four scenarios passed. [Machine-readable result](local-load.json), [actual console output](local-load.log). 53.83 seconds; ten rooms, 80 players, ten legacy compatibility displays, 100 waiting fill-existing guests, 190 intended concurrent sockets. One accepted injection/player plus ten duplicate retries, actual switch/release/battle boundaries, an eviction and identical results. No SQL/deadline/seed/hand fixture edits.

These commands ran as constituents, not as the newly added aggregate `npm run test:phase-d-local`. The aggregate is the repeatable local-only path; it performs a dry run and the same guard/inventory/load sequence, followed by the subsequently added LAN browser regression. It cannot target a deployed URL. Run `npm run measure:phase-d` after a build to refresh the offline inventory only.

Local harness HTTP p95 59.14ms; action acknowledgement p95 499.79ms. These reflect the 25ms polling harness, simultaneous loopback clients and repeated snapshots during alarms; they are not WAN latency, production browser traffic, billing requests or an SLA. The 100 queue guests use fill-existing with no public vacancy, so fresh-session ready/allocation bursts and all-dose/three-round sustained load remain untested by this new suite. Production NAT admission limits are not established because the harness rotates test client-IP headers.

## Observed diagnostics

The passing load run printed one RPC-result disposal diagnostic and one SQLite scheduled-alarm cancellation diagnostic. Exact output is retained above. They did not stop the suite or fail the state/result assertions. Their root cause is not established by this run; review repeated diagnostics/resource retention before a capacity sign-off rather than treating a passing assertion as proof of no leak. No production quota or live account conclusions are drawn.

## Open at the 15 October baseline

Physical device/browser models/versions and results, subjective sound/pacing/readability, real sleep/cellular/Wi-Fi recovery, cold/warm transferred bytes, device resource retention, exact deployed candidate/version, Cloudflare CPU/request/duration/row/storage counters, sustained/burst capacity and final user acceptance. No deployment, production load or account change occurred. Earlier 19-browser-scenario refinement evidence remains dated separately; it was not rerun or relabeled as Phase D physical evidence.

## Subsequent human-reported defect — LAN HTTP startup

The user reported a blank iPhone Chrome screen over LAN HTTP. [Reproduction, fix and actual retests](lan-http/README.md). `crypto.randomUUID()` was absent on the insecure origin; the client now uses a secure-byte UUID fallback. Check/build/guard, 228 unit tests, three real HTTP-origin browser scenarios and five existing refinement browser scenarios passed. Physical iPhone/Safari retest is pending. Updated [current asset inventory](assets.json) has a new frontend fingerprint; initial inventory is preserved above. The earlier backend load was not rerun or relabeled as this fix's evidence.
