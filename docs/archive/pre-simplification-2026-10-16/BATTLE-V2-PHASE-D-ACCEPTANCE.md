# Battle v2 Phase D — acceptance

The user indicated readiness for Phase D on 15 October 2026 after accepting the Phase C presentation refinements. **Current work is acceptance testing, not new gameplay. Phase D is not yet passed.** Deployment still needs a separate explicit instruction. Preserve all mechanics, credentials, private data, server entropy/persistence, infrastructure identities, Workers Free and workers.dev-only routing. No saved creatures/cards/cabinet, naming, signals or unrelated features.

[Specification](../../BATTLE-V2-SPEC.md), [implemented Phase C review](../release-closeout-2026-10-17/BATTLE-V2-PHASE-C-REVIEW.md), [accepted refinements](../release-closeout-2026-10-17/PREDEPLOY-REFINEMENT.md), [current status](../../IMPLEMENTATION-STATUS.md) and [evidence ledger](../../battle-v2-phase-d-review/README.md).

## Candidate and evidence

The candidate currently has uncommitted changes, so a Git HEAD alone cannot identify it. An initial LAN HTTP startup crash was found and fixed locally; see [defect and retest evidence](../../battle-v2-phase-d-review/lan-http/README.md). Physical-device retest remains pending. Record the eventual commit, exact deployment/version and origin in each human run; use the [built-output fingerprint](../../battle-v2-phase-d-review/assets.json) for the measured local tree. Do not test a historical deployed version and mark this candidate accepted. Hashes are identifiers, not security attestations.

| Gate | Current evidence | State |
| --- | --- | --- |
| Check/build/production exclusion and asset budget | Fresh local check/build/dry run, guard and byte inventory | Local baseline passed |
| Ten-room/100-idle-guest synchronization | Ten eight-player private rooms, ten legacy viewers, 100 waiting fill-existing guests; actual clocks/alarms, one injection/one round | Local baseline passed; sustained/deployed evidence open |
| Physical devices, touch, readability and pacing | User has iPhone/iPad and Linux desktop; first-pass matrix below | Pending human runs |
| Subjective sound, unlock, mute and motion | Earlier local browser assertions/captures only | Pending human runs |
| Sleep, offline/reconnect, cellular/Wi-Fi and real latency | Earlier local recovery/retry tests are historical, not a new WAN measurement | Pending |
| Cold/warm network and device memory/GPU retention | Compressed files measured; no physical resource measurements | Pending |
| Deployed HTTPS/copy/storage/WebSockets and account quotas | No new deployment or account measurements in this phase | Pending |
| Defects and final acceptance | Record actual outcomes and resolve blockers; user accepts remaining minor limits explicitly | Pending |

## First human pass — available devices

Use **iPhone Safari, iPad Safari and Linux Chrome** first. No additional browser installation is needed for this initial pass. Record device model, OS/browser version, orientation and network. Desktop Firefox is useful additional coverage; its presence as a system launcher is not evidence of a successful run. Do not infer one browser's result from another or count viewport emulation as a physical phone.

Choose a host on desktop and join on the iPhone/iPad. Start with two players, then repeat with all three devices. Existing local 2/4/8-client tests cover logical scaling; this human pass does not pretend to be eight physical people. Use separate browser profiles for extra synthetic participants if checking a full roster.

### Local production-build review without deployment

On the Linux machine, in the repository:

```sh
npm run check
npm run build
npx wrangler dev --ip 0.0.0.0 --port 8787
```

On devices on the same trusted local network, open `http://<Linux-LAN-IP>:8787`; use that same address on the desktop so invitation links use a reachable host. The machine's local firewall may need to allow TCP 8787 from your LAN. Do not forward the port through the public router. Stop the server with Ctrl+C afterwards. Enter the full numeric address including `http://` and the final `/` in Safari’s address bar and tap Go, for example `http://192.168.1.50:8787/` using your actual Linux IP. If the browser shows a blank screen with the older build, rebuild/restart and refresh; the client UUID helper now supports ordinary HTTP origins. This serves the built client and local Worker on one origin, preserving origin checks and local-only SQLite. It does not touch deployed rooms.

Use the built Worker address for this phone test. The separate Vite proxy is intended for local desktop development; changing its host alone does not establish valid cross-device origins. LAN HTTP will not establish production HTTPS/clipboard behavior: manual-copy fallback can be expected where the clipboard API is unavailable. A separately authorized workers.dev deployment is needed for that gate. No custom domain, tunnel, paid service or DNS change is required.

### Session checklist

For each run record pass/fail plus the phase and exact reproduction steps for a failure:

- [ ] Splash is readable, dismisses promptly and retains its inner scrollwork. Other panels retain only their outer Gothic frame.
- [ ] Quick Play/private entry, invitation code/link and inline copy/manual-copy feedback are clear. The blob, glass/brass injection reservoirs and all four specimen names fit portrait/landscape without clipping controls.
- [ ] Create/join a private laboratory on separate devices. Host starts; briefing is legible; specimen selection exposes appearance cues without hidden effects.
- [ ] All devices see the same accepted mutations and attribution. Closely timed injections do not create a visible backlog. Each player has six doses, injections remain six seconds apart and Unleash becomes available one second after an accepted injection in a fresh rules-0.5.0 attempt.
- [ ] Unleash forfeits unused doses and stops only that player's injections. Six doses never auto-switch. Test unanimous completion and a separate timer-expiry release; integration lasts five seconds with the same form/arena on all devices.
- [ ] Enable sound with a gesture on each device; listen for balance, excessive loudness/clipping, missing cues and onset-only effects. Test mute/volume independently, persistence after reload and an unmuted peer while another device is muted. Captions still explain events with sound off.
- [ ] Review battle readability: health, attack/defense direction, shields, blocked-strike suppression, registered bodies/grafts, no mirrored words, 3/2/1 countdown and centered final lettering. Timeout winner/draw subtitle appears only for a timer result. Temporary effects clear at the deadline.
- [ ] Complete all three rounds and compare team outcome, score and awards across devices. Fresh round resets the creature and doses; host advance and replay preserve the intended roster.
- [ ] Test normal Leave, leave→rejoin and leave→create; successful leave clears recovery, failed/disconnected leave does not silently discard it. Explicit disconnected-device reset remains distinct.
- [ ] Test reduced motion, pause decorative animation, keyboard/focus, text enlargement/zoom and device screen-reader labels. No flashing or cramped fixed action bar; specimen labels and invitation-copy control remain usable.

### Network and recovery pass

Run on at least two physical devices; note exact wait lengths and when the connection was lost:

- [ ] Lock/background one phone during experiment, release and battle in separate trials; return after 5, 20 and more than 60 seconds. It seeks the current accepted state, suppresses old sound bursts and does not reroll a form or restart a clock. If absence crosses configured grace/recovery boundaries, expect the documented recovery/abandoned-attempt flow, not unconditional seat survival.
- [ ] Switch the phone between Wi-Fi and cellular when available. Compare both devices after reconnect and after reload. No extra dose, repeated switch or duplicated room admission.
- [ ] Interrupt connectivity while an injection or entry is pending, then restore it. The intention resolves once or shows a clear recoverable error; never spend a dose twice. Do not clear stored credentials to simulate routine recovery.
- [ ] Use browser network throttling for repeatable slow HTTP/media tests; report its configured rate/latency separately from real Wi-Fi/cellular results. Do not claim it delays existing WebSocket frames unless the chosen tool actually does so.
- [ ] Test an unavailable/slow art file: readable fallback/retry and controls remain; accepted clocks continue. Reservoir art failure uses native tubes; retrying creature art does not repeat entry.
- [ ] Quick Play on independent devices: two-player 30-second fallback, 4–6 ready cohort where available, ready expiry/cancel, public three-round results and voluntary replay. Never promise a queue duration or create hidden guests.

### Device performance and asset budget

- [ ] Record cold and warm loads with real network transfer/request counts and time until usable controls/visible chamber. The whole shipped library is not an initial download.
- [ ] Review all six player forms, six rivals and three arenas over sessions or the clearly labeled local development study; production selection remains server-owned. Track unobserved combinations instead of forcing client choices.
- [ ] After three rounds and repeated replay, check sustained smoothness, device temperature, memory/GPU retention where measurable, audio gaps and tab crashes. Report actual values/tools, not the theoretical image-memory arithmetic.
- [ ] Retain selected-pair loading, no accumulating renderers/sockets and bounded effect/audio behavior. Fix regressions discovered in acceptance without silently changing mechanics or budgets.

## Capacity and Workers Free acceptance

The new `npm run test:phase-d-local` is **local-only**. It creates isolated SQLite and 190 native sockets (80 players, ten compatibility viewers, 100 owner-authenticated idle fill-existing guests), performs one simultaneous injection per player plus duplicate retries, uses actual switch/release/battle alarms, verifies synchronized results and an eviction. It cannot target an external URL. The aggregate also runs the LAN-origin browser regression for the discovered HTTP startup boundary. Its HTTP polling/loopback timings are test overhead, not production traffic estimates or an SLA.

Outstanding controlled capacity run: ten eight-player rooms, all six doses where chosen, three rounds/replay, plus at least 100 idle queued guests; include fresh ready/allocation bursts and cancellation/recovery churn separately from idle fill tickets. Deployed testing begins only after the exact candidate is published with explicit instruction and the owner confirms available free-tier headroom. Keep a bounded cohort, record duration/counts and clean up test entries; stop for quota/resource errors or client state divergence. Never upgrade the plan automatically.

Record the account's before/after Workers requests/CPU/errors and Durable Object requests, duration, SQL rows read/written and storage. Include `MatchmakingPool` and `GuestLease`, alarms, owner queue sockets and idle hibernation—not just `LaboratoryRoom`. Record the dashboard time window and UTC reset; observed deltas are account-level where the provider does not expose a narrower breakdown. No deployed capacity claim until these measurements exist.

Official references checked 15 October 2026: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) list Free 100,000 requests/day and 10ms CPU per HTTP request; [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) lists Free SQLite-only support, 100,000 requests/day, 13,000 GB-s/day, five million row reads/day, 100,000 row writes/day and 5GB storage. Limits can be account-wide and actual usage/headroom must be checked. Durable Object free-limit exhaustion causes relevant operations to fail; local Miniflare does not measure those meters. Recheck official limits before the deployed load run; do not conflate Worker CPU and Durable Object duration.

## Recording a result and completion

Use a row per actual run; blanks/pending are not passes. Do not paste credentials, private hands or reconnect tokens into reports.

| Date / commit or build fingerprint / origin | Device / OS / browser / network | Private/public, players, rounds | Checks completed | Issues / evidence / disposition |
| --- | --- | --- | --- | --- |
| Pending | iPhone / Safari / model and versions pending | Pending | Pending | Pending |
| Pending | iPad / Safari / model and versions pending | Pending | Pending | Pending |
| Pending | Linux / Chrome / versions pending | Pending | Pending | Pending |

Phase D closes only after the relevant human/device/network/performance/quota gates have evidence, blocking defects are fixed and rechecked, remaining minor gaps are explicitly recorded, and the user accepts the result. Deployment and Phase D completion are distinct events. Keep Phase C/refinement evidence accessible during acceptance; archive closed material with repaired links at the next cleanup boundary. Do not set `fullReleaseAvailable` to true merely because testing has begun.
