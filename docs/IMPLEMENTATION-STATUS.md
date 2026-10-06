# Implementation status

The remote-first plan was approved on 5 October 2026. Step 1 is deployed. The user authorized **step 2 only** on 5 October 2026; public matchmaking remains step 3.

## Successful foundation deployment

The user completed Cloudflare authentication and deployment locally and reported the live foundation at https://monstrum-mortis.scott-jeffrey-miller.workers.dev on 5 October 2026. Its `/api/health` returned `service: monstrum-mortis`, `stage: foundation`, `protocolVersion: 1`, `rulesVersion: 0.1.0`, all four configured bindings true, and `gameplayAvailable: false`.

This records a user-verified deployment wiring result, not storage operations, WebSockets, multiplayer, or a new deployment from this session. Local login does not need repeating. The existing apex and www self-hosted site remain separate.

## Step 1 deliverables and earlier verification

- React/Vite client, Worker, client-safe shared contracts, server-only catalogues, asset inventory and documentation.
- Rules 0.1.0 cover approved timing, player counts, reconnect, scaling and tarot dimensions. The 30 DNA entries and six rivals remain design records with uncalibrated combat values.
- Production assets remain planned; there is no generated playable artwork or audio.
- Exact-version npm lockfile and generated Wrangler binding types; workers.dev-only routing and three SQLite-backed infrastructure classes.
- Original chat-workspace configuration/type checks, five foundation tests, client build and deploy dry run passed. That environment could not start the local runtime (`uv_interface_addresses`), authenticate to Cloudflare or push GitHub changes. The user's later local authentication and foundation deployment supersede that earlier deployment-access gap.

## Step 2 changes in this working tree

- Actual SQLite persistence with explicit schema 2, atomic state/action-receipt/alarm writes, idle/hard expiry and bounded cleanup.
- Collision-checked six-character private codes, invitation links, replay-safe creation/join keys, eight player seats, separate display sessions and waiting seats for mid-round private invitees.
- Hashed reconnect tokens, strict body/message validation, source-IP entry limits, per-seat action/connection limits, host authorization, immediate leave/revocation, and controller-only private snapshots.
- Hibernating WebSockets with attachment restoration, explicit connection replacement, synchronized revisions and snapshots, heartbeat detection and reconnection using the same seat.
- Authoritative briefing, experiment and release deadlines; chronological alarm catch-up, 15-second disconnect grace, host transfer, fixed experiment player count, and 30-second recovery pause/abandonment.
- Binding-only public allocation/reservation/cancellation contracts. Public browser admission requires an expiring single-owner grant; guessed codes cannot admit players. These are contracts for step 3, not a queue or cross-pool guest lease implementation.
- A minimal browser service console supports private creation/join, code/link display entry, roster, deadlines, host timeline start, leave and reconnect controls. It does not claim finished game presentation.
- Protocol **2** reflects the new service wire contract; gameplay defaults remain **rules 0.1.0**. Health reports `stage: room-service`, `roomServiceAvailable: true`, and `gameplayAvailable: false` when running this tree.

The step 2 timeline deliberately stops at `battle`, awaiting the step 6 combat producer. Empty trays and zero dose budgets reflect that DNA dealing/mechanics are step 5. No outcomes, cards, automatic results, score or completed three-round gameplay are manufactured. Public activation/progression/replacements/replay belong to step 3.

## Current-session verification (5 October 2026)

Completed:

- Reviewed a clean working tree and all six requested project documents before editing.
- Initial check/build attempts under the shell's Node 18 failed; rerunning with the already-installed Node 24.21.0 resolved that environment mismatch. No dependencies or lockfile versions were changed.
- `npm run check`: configuration guard, both TypeScript projects, five foundation tests and six deterministic room/validation tests passed (11 total).
- `npm run build`: production Vite build passed.
- `npm run deploy:dry`: Worker bundle passed and listed all four existing bindings; no publication occurred.
- `npm run dev:worker`: Wrangler local server successfully started on port 8787 after approval to run outside the filesystem/network sandbox. The sandbox itself blocked Wrangler log writes and network-interface access.
- Local HTTP smoke checks: Wrangler served the built client HTML and health returned protocol 2, room-service stage, all four bindings true, and gameplay unavailable.
- `npm run test:rooms`: all **13 runtime scenarios passed** with eight independent network player clients and a display. Verified creation/join replay, capacity, authorization and private projections, explicit replacement, grace reconnection, alarm-driven host transfer, fixed player count, waiting seats, public grants/cancellation, Durable Object eviction with live hibernating sockets, real 8/75/5-second phase alarms, identical client state/revisions, full runtime restart, persisted action replay, token hashes, reservation expiry, runtime validation/rate limits, and secret-data cleanup.
- Cleanup verification seeded an expired last-activity timestamp in the isolated test SQLite database and exercised real server expiry handling; it did not wait two wall-clock hours. The deterministic tests separately cover recovery pause/resume/abandonment and hard/idle timing boundaries.
- The runtime harness initially used obsolete Miniflare option names and lacked the inspection opt-in; those harness failures were corrected using the locked library API before the final passing run. Database inspection is enabled only in the isolated test harness.

`npm run test:rooms` uses isolated local workerd/Miniflare, separate network clients and temporary SQLite persistence, which it removes on completion. Local runtime results cannot establish deployed room behavior or account quota. The npm lockfile, Worker bindings/class names, SQLite export configuration, and domain routing remain unchanged. `git diff --check` passed.

## Follow-up: entry-key lifecycle regression

- Successful private create/join now clears the client's completed entry key. Leaving and entering again with unchanged name/code or creation details starts a fresh operation; failed requests retain their key for idempotent retries.
- Added six component-handler regression checks: leave → rejoin, leave → create, and network/HTTP retry retention for each entry mode. They exercise the actual `App.tsx` handlers with controlled hooks and browser/transport doubles. All six reproduced key reuse before the fix and passed afterward.
- Re-ran `npm run check` successfully (configuration guard, both TypeScript projects and all three test files), `npm run build`, and the focused six-check client regression suite using Node 24.21.0. `git diff --check` passed. No dependencies, rules, protocol, Worker behavior, or deployment configuration changed; the 13 backend runtime scenarios above remain the earlier step 2 verification.

Outstanding:

- Publish this step 2 tree only when requested; the workers.dev origin remains the previously reported foundation deployment.
- Test the published room service with independent browser sessions and at least two human-operated devices. No deployed room/WebSocket check or human playtest has been completed in this session.
- Measure latency, deliberate network delay/loss and free-tier resource consumption before making capacity claims. Ten-room load and 100 idle queued guests belong to the later acceptance work; queues do not exist yet.

## Follow-up: player entry clarity

- Renamed the entry field to `Player Name`, added an amber field border and explanatory name-required hint, and replaced the disabled-button loading cursor with `not-allowed`. Display entry still does not require a player name.
- Successful entry removes the consumed `room` and `display` URL parameters while preserving unrelated parameters and the hash. Reload identification continues through tab-local credentials.
- Chat-workspace verification: `npm run check` passed (17 tests and both TypeScript projects), `npm run build` passed, and `git diff --check` passed. No Worker, rules, dependencies, or hosting changes. These edits have not been pushed or deployed; human device verification remains outstanding.

## Not implemented

Step 3 regional public queues, readiness/allocation orchestration, cross-pool guest leases, public activation/results/recovery/replacement/replay; step 4 art/scene; step 5 DNA mechanics; step 6 battle/outcomes/awards/complete three-round play; step 7 exports/cabinet; step 8 polish and broad failure/load/device testing; step 9 complete-game deployment.
