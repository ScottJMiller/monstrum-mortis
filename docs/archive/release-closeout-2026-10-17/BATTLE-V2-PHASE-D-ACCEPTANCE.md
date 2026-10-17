# Phase D — current human acceptance

> Historical record archived at release closeout (17 October 2026 UTC). Instructions, open items and candidate descriptions below describe their dated scope. Current [rules](../../APPROVED-PLAN.md), [status](../../IMPLEMENTATION-STATUS.md) and [completed acceptance](../../BATTLE-V2-PHASE-D-ACCEPTANCE.md) supersede them.

The user approved the complete [simplification](PHASE-D-SIMPLIFICATION-PROPOSAL.md) and explicitly authorized deployment to the existing workers.dev address on **16 October 2026** to simplify device testing. The user has now accepted the four grouped human-testing items: latest device fixes, three-round multiplayer/timing/solo continuation, interruptions/recovery, and accessibility/performance. Final regression, Cloudflare Free-quota review and documentation closure remain open. Phase D is not passed by local tests or deployment alone. [Status](../../IMPLEMENTATION-STATUS.md) identifies the candidate and actual results. [Earlier acceptance baseline](../pre-simplification-2026-10-16/BATTLE-V2-PHASE-D-ACCEPTANCE.md) retains the previous checks and quota references.

Use iPhone Safari, iPad Safari and Linux Chrome first. No extra desktop browser is required. Record model, OS/browser, orientation, network, deployment version/date and failures. Chromium viewport emulation is not physical Safari evidence.

## Human acceptance recorded — 16 October 2026

The user instructed: “Consider 1 through 4 complete,” referring to the four human-testing groups above. The checked items below record **user acceptance**, not a new agent-run device test. No new raw timing, transfer, memory, model/OS or quota measurements were supplied; earlier local/historical evidence retains its original scope. Device-fix follow-ups below are accepted through this instruction.

## Short first pass

- [x] Open the deployed HTTPS address on all three devices. Splash stays up 15 seconds including 3/2/1, but Enter skips it immediately. Reconnection bypasses it.
- [x] Accept/edit the assigned alias. Create one public lab and choose that same named row from the other devices; roster disclosure/counts work. There are no private codes, hosts or late-round seats.
- [x] At two connected players, formation begins at 30 seconds. Start now needs a strict majority (2/2 or 2/3). Its final three seconds close new admission. The creator has no extra privilege.
- [x] Measure the first and second experiment. Each authoritative experiment is 75 seconds. Report first visible tray time, displayed remaining seconds and any delayed client/network conditions; do not infer timing just from animation.
- [x] Check compact chamber/readings left, vertically scrolling four-vial rail/actions right, and roster below in portrait/landscape. Labels, selection, doses and ready buttons need no explanation. First/replacement selection is automatic, injection is explicit.
- [x] Each player has six doses. Accepted injections match on every device. Injection cooldown is six seconds, Unleash one second; six doses never auto-unleash. Pulling the switch forfeits unused doses and ends only that player's injections.
- [x] Integration lasts five seconds. Phone/tablet battle fills the app viewport; desktop uses full width. Compare creature name, form, arena, health, final wording and outcome. Captions/mute/leave remain usable.
- [x] Listen on each actual device: first tap unlocks sound with a gentle fade, saved mute/volume is honored, no clipping or old-cue burst occurs after backgrounding. Mute one device without muting another.
- [x] Results initially show top facts/own award; details expand on demand. Next experiment is visible without scrolling and retains the ten-second minimum reading window. Complete all three rounds.
- [x] Explicit Leave prevents the same guest rejoining that lab, including after reload; joining a different lab works. Leaving down to one lets that scientist finish all remaining rounds with six doses and no solo potency bonus. One person cannot start a fresh session/replay.

## Recovery, accessibility and performance

- [x] Brief network interruption/reload reconnects the same seat/hand/doses. Test a pending injection retry; it consumes once. After the 15-second grace, current-round injection eligibility does not return, but existing membership can reconnect for the next round while others continue.
- [x] Background/sleep during experiment/release/battle; return after 5, 20 and >60 seconds. Seek current state without rerolling or restarting the clock/audio. At zero connected members after grace, the lab closes.
- [x] Try Wi-Fi/cellular changes, slow/failed art, reduced motion, paused decorative animation, keyboard/focus, screen reader and enlarged text. Loading/cosmetics never pause server time. No supported mutation silhouette should clip.
- [x] Record cold/warm transfer/time-to-controls, memory/GPU symptoms and several-round stability on real hardware. Current original art/derivatives are retained; no new runtime generation or paid service exists.
- [x] Inspect actual Cloudflare account usage and remaining Free quotas before any sustained/deployed load test. Ordinary small manual playtesting is authorized; synthetic production load is not. Keep Workers Free and the same SQLite bindings/workers.dev origin. Never change scottjmiller.com/www routes or DNS.

Record actual observations in docs/battle-v2-phase-d-review. Old private/queue/display/load scenarios are historical and do not establish current acceptance. Current local commands are `npm run test:simplification`, `npm run test:composition`, `npm run simulate:combat` and `npm run measure:phase-d`. No quota claim follows from local Miniflare or Node timing. Final human acceptance remains the user's decision.

## Follow-up correction: touch audio and oversized timeout text

The user's earlier iPhone/iPad silence and oversized desktop wording were confirmed failures; their corrections are now user-accepted as part of items 1–4. The [16 October correction](../../battle-v2-phase-d-review/audio-lettering-fix/README.md) changes gesture/retry/session handling and fits final text to its arena. Retest current iPhone/iPad Safari (media volume, silent mode, saved mute, app-switch return) and desktop long/short timeout phrases with resizing/zoom. Local trusted-touch Chromium/PCM and glyph-bound evidence do not close this hardware checklist.

## Follow-up correction: page swipes and desktop viewport

The user reported blocked iPhone/iPad swipes over artwork and cut-off desktop battles. [Correction and local evidence](../../battle-v2-phase-d-review/viewport-scroll-fix/README.md). Retest native swipes beginning on the chamber, integrated creature and arena in portrait/landscape; page content should scroll where it overflows. Check desktop integration/battle immediately on entry at normal and short/wide window sizes, without dragging to resize. Entire creatures, health, captions and sound/Leave/settings must remain reachable. Confirm ordinary taps, mute/audio and artwork retry still work. This physical follow-up is now user-accepted as part of items 1–4.

## Remaining item 5 — release verification and closure

- [x] Run the current candidate on Node 24 with the committed lockfile: `npm run test:phase-d-local`, `npm run test:composition`, `npm run simulate:combat`, `npm run test:audio-lettering`, `npm run test:viewport-scroll`. Stop on failure and preserve actual results. The first command includes configuration/types/unit tests, build, Worker dry run, room/DNA/browser regressions, asset guards and the asset inventory. These commands do not deploy or generate production load.
- [x] Review actual Cloudflare account usage/headroom and candidate errors: Worker requests/CPU, Durable Object requests/duration, SQLite rows read/written and storage. Include other Workers sharing the account allowance. Record date/range and observed usage against current Free allowances. No synthetic production load without verified headroom and a bounded approved plan.
- [ ] Tie final passing evidence to the release Git commit and deployed Worker version/bundle. Deploy again only if runtime code/assets differ from the tested deployed candidate; a documentation-only commit does not require deployment. Keep workers.dev/Free/bindings unchanged.
- [ ] Reconcile current plan/status/handoff/acceptance and archive obsolete guidance with links/history preserved. Mark Phase D complete only once this final verification is actually finished; do not turn the requested checklist into claimed test/quota evidence.

Cloudflare references: [Worker limits](https://developers.cloudflare.com/workers/platform/limits/), [Durable Objects allowances](https://developers.cloudflare.com/durable-objects/platform/pricing/), [Durable Objects metrics](https://developers.cloudflare.com/durable-objects/observability/metrics-and-analytics/). Current account usage has not been inspected by this documentation update.


## Final evidence received

The user reported all listed final Node 24 checks passed. The supplied namespace PDFs/account totals establish low observed Free-plan usage; the supplied two-device logs were inspected in the [sanitized log review](../../battle-v2-phase-d-review/log-review/README.md). Checked final-test/quota items reflect that user-supplied evidence, not newly agent-run commands or direct account access. No confirmed exception/resource failure/gameplay defect was identified in the live capture. The historical eight-count mismatch and individual cancellation causes are unresolved metadata limitations, not eight proven bugs. Final record reconciliation/closure remains pending; no production load test or larger capacity claim follows.
