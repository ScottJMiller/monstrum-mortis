# Implementation status

The remote-first plan was approved on 5 October 2026. The user declared step 2 complete and authorized **step 3 only** on 6 October 2026. This tree implements step 3; step 4 and later remain unauthorized. The last deployment evidence supplied in this conversation is the step 1 foundation, recorded below. This session has not published a deployment.

## Successful foundation deployment

The user completed Cloudflare authentication and deployment locally and reported the live foundation at https://monstrum-mortis.scott-jeffrey-miller.workers.dev on 5 October 2026. Its `/api/health` returned `service: monstrum-mortis`, `stage: foundation`, `protocolVersion: 1`, `rulesVersion: 0.1.0`, all four configured bindings true, and `gameplayAvailable: false`.

This records a user-verified deployment wiring result, not storage operations, WebSockets, multiplayer, or a new deployment from this session. Local login does not need repeating. The existing apex and www self-hosted site remain separate.

## Step 1 deliverables and earlier verification

- React/Vite client, Worker, client-safe shared contracts, server-only catalogues, asset inventory and documentation.
- Rules 0.1.0 cover approved timing, player counts, reconnect, scaling and tarot dimensions. The 30 DNA entries and six rivals remain design records with uncalibrated combat values.
- Production assets remain planned; there is no generated playable artwork or audio.
- Exact-version npm lockfile and generated Wrangler binding types; workers.dev-only routing and three SQLite-backed infrastructure classes.
- Original chat-workspace configuration/type checks, five foundation tests, client build and deploy dry run passed. That environment could not start the local runtime (`uv_interface_addresses`), authenticate to Cloudflare or push GitHub changes. The user's later local authentication and foundation deployment supersede that earlier deployment-access gap.

## Step 2 implementation (historical)

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

Outstanding at the step 2 handoff (current work is recorded below):

- Publish this step 2 tree only when requested; the workers.dev origin remains the previously reported foundation deployment.
- Test the published room service with independent browser sessions and at least two human-operated devices. No deployed room/WebSocket check or human playtest has been completed in this session.
- Measure latency, deliberate network delay/loss and free-tier resource consumption before making capacity claims. Ten-room load and 100 idle queued guests belong to the later acceptance work; queues were deferred until step 3.

## Follow-up: player entry clarity

- Renamed the entry field to `Player Name`, added an amber field border and explanatory name-required hint, and replaced the disabled-button loading cursor with `not-allowed`. Display entry still does not require a player name.
- Successful entry removes the consumed `room` and `display` URL parameters while preserving unrelated parameters and the hash. Reload identification continues through tab-local credentials.
- Chat-workspace verification: `npm run check` passed (17 tests and both TypeScript projects), `npm run build` passed, and `git diff --check` passed. No Worker, rules, dependencies, or hosting changes. These edits have not been pushed or deployed; human device verification remains outstanding.

## Not implemented

Step 4 art/scene; step 5 DNA mechanics; step 6 battle/outcomes/awards/complete three-round play; step 7 exports/cabinet; step 8 polish and broad failure/load/device testing; step 9 complete-game deployment.

## Step 3 implementation (6 October 2026)

The user explicitly declared step 2 complete and requested step 3. A clean working tree and passing baseline checks were reviewed before implementation. Authorization is recorded in AGENTS.md, the approved plan and the handoff; later milestones remain deferred.

Implemented:

- Three regional SQLite-backed queue coordinators, response-time probes/manual selection, fresh FIFO grouping at four guests, filling to six, thirty-second two-player fallback, ten-second readiness and sixty-second alternatives.
- Server-issued opaque guest credentials, authored aliases/symbols, one fenced queue/room claim per issued guest, conditional transfer/release, expiry and cancellation tombstones. Existing issued identities also claim private player entries; legacy private-only invitation identities remain supported.
- Owner-only queue status and hibernating sockets, bounded HTTP/sync limits, explicit inactive resumption, cancellation before connection, temporary admission expiry and priority retention after failed checks/allocations.
- A durable allocation journal recorded before cross-object operations, idempotent room grants and reactivation retry. A persisted, sequenced vacancy-notification outbox retries by alarm and avoids room/pool callback deadlocks.
- Hostless public start, explicit between-round/recovery replacement consent and context, independent room phase/capacity/lease checks, fixed round player count and preserved private/display behavior.
- Public results timers, minimum reading time/early advance, recovery abandonment and same-round retry, regroup opt-in/new session/reset score and explicit Find New Laboratory/exit choices. These use a binding-only future battle-completion boundary; no browser can submit a battle outcome.
- Browser rehearsal/skip, queue cancellation/readiness/resumption, stable queue/admission operation keys across retries and reload, room reconnect/progression controls and participant-issued shared display tabs.
- An inactivity prompt/expiry hook for initialized per-round injection/interaction counters. Step 5 must initialize/update those counters with real gameplay; service-only rounds do not falsely mark everyone inactive.
- Protocol **3**, unchanged rules **0.1.0**, schema **3** with an explicit private-room schema-2 migration. Health reports public-matchmaking with room/matchmaking available and gameplay unavailable. No bindings, class identities, DNS, hosting configuration, dependencies or lockfile versions changed.

Verification:

- `npm run check`: configuration guard, both TypeScript projects and **30 tests** passed. Includes ten deterministic matchmaking/public-progression checks, three actual QuickPlay component-handler regressions and the prior seventeen checks.
- `npm run build` and the Worker deploy dry run passed with all four existing bindings. Sandbox attempts could not write Wrangler logs/open local sockets; approved runs outside the sandbox completed. No publication occurred.
- `npm run test:rooms`: all **13 private/legacy admission runtime scenarios** passed, including explicit schema-2 private-room migration with preserved credentials.
- `npm run test:matchmaking`: all **7 public runtime scenarios** passed after final hardening, including pending-grant expiry release, cancellation fences, allocation journal replay, runtime restart, replacement/recovery admission and regroup opt-in.
- Independent queue and room network clients verified real ten-second readiness, eight-second briefing and thirty-second fallback; owner projection privacy, cross-pool claim races, cancellation fences, inactive priority, hostless admission, hibernating eviction, persisted allocation replay, runtime restart, replacements and guest release.
- Runtime fixtures seed the future battle boundary, regroup deadline, pending-grant expiry and failed-reconnection timestamps, then exercise actual binding completion, browser intents, storage, room settlement and synchronization. They do not validate combat or claim three-round gameplay. Deterministic tests cover exact twenty-five/ten/thirty/sixty-second progression boundaries.
- `git diff --check` passed. The committed npm lockfile and workers.dev-only SQLite deployment configuration are unchanged.
- Browser handlers are tested with controlled hooks/storage/transports, including lost admission responses and reload recovery. This is not a human browser/device playtest.

Remaining integration and operational checks:

- Step 5 DNA dealing, budgets, injections, switch activity and participation-counter updates; step 6 real combat producer, outcomes/awards and complete three-round gameplay; step 7 cards/cabinet. Results/recovery/replay orchestration exists, but the production service still stops at battle until those producers exist.
- No new deployed-origin storage/WebSocket verification or human two-device playtest was performed. Publish only when requested; health is still only wiring evidence.
- Cross-region response measurements from real devices, deliberate network delay/loss, ten-room/idle-guest load and free-plan quota consumption remain unmeasured. Pools organize matchmaking rather than promise physical execution-region pinning.
- Anonymous credentials cannot enforce person-level uniqueness across deliberately separate browser identities. Legacy private-only identities remain independent anonymous seats; issued guest credentials enforce exclusion across public pools and private entries carrying that identity.

## Follow-up: stale tickets and lost room credentials

- Missing queue tickets no longer remain in browser storage indefinitely. Recovery clears the stale ticket, preserves the guest identity, and checks the authenticated owner's current server claim. An in-flight entry is not classified as missing before its request finishes.
- Check previous session and explicit Leave previous laboratory/Cancel previous queue controls allow recovery when a room reconnect credential has been lost. New owner-authenticated API routes use the observed claim kind, ID and nonce; stale requests cannot release a newer claim. Private and public seats are revoked and their sockets closed before conditional claim release. No automatic identity reset or involuntary session exit is performed.
- Added a component regression for missing-ticket recovery with an existing room claim and a focused `npm run test:recovery` runtime harness. The runtime uses isolated SQLite and independent sockets and checks private/public lost-seat recovery, queue cancellation, wrong-token rejection, wrong-owner no-op, stale nonce rejection and preservation of a newer queue claim.
- Chat-workspace verification: 31 tests, both TypeScript projects, configuration checks, client build and Worker dry run passed. All seven existing public matchmaking runtime scenarios passed. The first combined follow-up fixture expected a new ticket to remain waiting, but an existing pool legitimately started a ready check; its assertion was corrected to preserve the live ticket rather than require that state. The recovery harness verifies server-initiated closing and token revocation. The local Node client stayed in CLOSING rather than reaching CLOSED promptly; complete browser close-handshake behavior remains a human-device check. These are local results, not deployed or human-device verification.
- These edits have not been pushed or deployed. The existing step 3 bindings, protocol 3, rules 0.1.0, dependencies, lockfile and workers.dev-only routing remain unchanged.

- Local patch-application verification (6 October 2026): `session-recovery.patch` applied cleanly to a clean working tree. `npm run test:recovery` passed, including configuration checks, both TypeScript projects, all 31 automated tests, client build, Worker deploy dry run, and the focused private/public session-recovery runtime checks. `npm run test:matchmaking` also passed all seven existing runtime scenarios. Sandbox log/socket restrictions required approved execution outside the sandbox. `git diff --check` passed. No deployment occurred; browser/device close-handshake verification remains outstanding.

## Follow-up: fresh-cohort briefing connection race

- Confirmed players admitted while the room is still in its lobby can finish opening their sockets after the first two connections start briefing. Round initialization previously marked those pending players ineligible, and their later socket connections never restored round-one eligibility.
- Public fresh-admission connections before the existing briefing deadline now join the locked roster. This does not extend briefing, change the ready check, unlock an experiment already underway, admit replacement grants, or undo an expired-grace finish.
- Added four deterministic regressions covering three through six players; all four failed before the fix and passed afterward. An additional boundary test preserves replacement/finished-viewer/experiment restrictions.
- `npm run check` passed: configuration checks, both TypeScript projects and 36 tests. Client build and Worker dry run passed. A focused independent-socket runtime using three lobby admissions verified that the third connection joins round one, every player sees the correct roster, the real eight-second briefing deadline is preserved, and the experiment locks its player count at three. `git diff --check` passed.
- `npm run test:fresh-admission` runs that runtime check with the required build/dry run. No dependencies, protocol, rules, bindings, or hosting configuration changed. These changes have not been pushed or deployed; repeat the three-device Quick Play test after publication.

- Local patch-application verification: `fresh-admission-fix.patch` applied cleanly to a clean working tree. `npm run test:fresh-admission` passed with configuration checks, both TypeScript projects, all 36 automated tests, client build, Worker deploy dry run, and the three-client runtime test of staggered fresh connections and the real briefing deadline. Sandbox restrictions on Wrangler logs and local sockets required approved execution outside the sandbox. `git diff --check` passed. No deployment occurred; the published three-device Quick Play test remains outstanding.
