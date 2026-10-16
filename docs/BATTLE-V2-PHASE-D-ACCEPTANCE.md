# Phase D — current human acceptance

The user approved the complete [simplification](PHASE-D-SIMPLIFICATION-PROPOSAL.md) and explicitly authorized deployment to the existing workers.dev address on **16 October 2026** to simplify device testing. This is an implementation/testing candidate; Phase D is not passed by local tests or deployment. [Status](IMPLEMENTATION-STATUS.md) identifies the candidate and actual results. [Earlier acceptance baseline](archive/pre-simplification-2026-10-16/BATTLE-V2-PHASE-D-ACCEPTANCE.md) retains the previous checks and quota references.

Use iPhone Safari, iPad Safari and Linux Chrome first. No extra desktop browser is required. Record model, OS/browser, orientation, network, deployment version/date and failures. Chromium viewport emulation is not physical Safari evidence.

## Short first pass

- [ ] Open the deployed HTTPS address on all three devices. Splash stays up 15 seconds including 3/2/1, but Enter skips it immediately. Reconnection bypasses it.
- [ ] Accept/edit the assigned alias. Create one public lab and choose that same named row from the other devices; roster disclosure/counts work. There are no private codes, hosts or late-round seats.
- [ ] At two connected players, formation begins at 30 seconds. Start now needs a strict majority (2/2 or 2/3). Its final three seconds close new admission. The creator has no extra privilege.
- [ ] Measure the first and second experiment. Each authoritative experiment is 75 seconds. Report first visible tray time, displayed remaining seconds and any delayed client/network conditions; do not infer timing just from animation.
- [ ] Check compact chamber/readings left, vertically scrolling four-vial rail/actions right, and roster below in portrait/landscape. Labels, selection, doses and ready buttons need no explanation. First/replacement selection is automatic, injection is explicit.
- [ ] Each player has six doses. Accepted injections match on every device. Injection cooldown is six seconds, Unleash one second; six doses never auto-unleash. Pulling the switch forfeits unused doses and ends only that player's injections.
- [ ] Integration lasts five seconds. Phone/tablet battle fills the app viewport; desktop uses full width. Compare creature name, form, arena, health, final wording and outcome. Captions/mute/leave remain usable.
- [ ] Listen on each actual device: first tap unlocks sound with a gentle fade, saved mute/volume is honored, no clipping or old-cue burst occurs after backgrounding. Mute one device without muting another.
- [ ] Results initially show top facts/own award; details expand on demand. Next experiment is visible without scrolling and retains the ten-second minimum reading window. Complete all three rounds.
- [ ] Explicit Leave prevents the same guest rejoining that lab, including after reload; joining a different lab works. Leaving down to one lets that scientist finish all remaining rounds with six doses and no solo potency bonus. One person cannot start a fresh session/replay.

## Recovery, accessibility and performance

- [ ] Brief network interruption/reload reconnects the same seat/hand/doses. Test a pending injection retry; it consumes once. After the 15-second grace, current-round injection eligibility does not return, but existing membership can reconnect for the next round while others continue.
- [ ] Background/sleep during experiment/release/battle; return after 5, 20 and >60 seconds. Seek current state without rerolling or restarting the clock/audio. At zero connected members after grace, the lab closes.
- [ ] Try Wi-Fi/cellular changes, slow/failed art, reduced motion, paused decorative animation, keyboard/focus, screen reader and enlarged text. Loading/cosmetics never pause server time. No supported mutation silhouette should clip.
- [ ] Record cold/warm transfer/time-to-controls, memory/GPU symptoms and several-round stability on real hardware. Current original art/derivatives are retained; no new runtime generation or paid service exists.
- [ ] Inspect actual Cloudflare account usage and remaining Free quotas before any sustained/deployed load test. Ordinary small manual playtesting is authorized; synthetic production load is not. Keep Workers Free and the same SQLite bindings/workers.dev origin. Never change scottjmiller.com/www routes or DNS.

Record actual observations in docs/battle-v2-phase-d-review. Old private/queue/display/load scenarios are historical and do not establish current acceptance. Current local commands are `npm run test:simplification`, `npm run test:composition`, `npm run simulate:combat` and `npm run measure:phase-d`. No quota claim follows from local Miniflare or Node timing. Final human acceptance remains the user's decision.

## Follow-up correction: touch audio and oversized timeout text

The user's iPhone/iPad silence and oversized desktop wording are actual failures, not passed acceptance. The [16 October correction](battle-v2-phase-d-review/audio-lettering-fix/README.md) changes gesture/retry/session handling and fits final text to its arena. Retest current iPhone/iPad Safari (media volume, silent mode, saved mute, app-switch return) and desktop long/short timeout phrases with resizing/zoom. Local trusted-touch Chromium/PCM and glyph-bound evidence do not close this hardware checklist.

## Follow-up correction: page swipes and desktop viewport

The user reported blocked iPhone/iPad swipes over artwork and cut-off desktop battles. [Correction and local evidence](battle-v2-phase-d-review/viewport-scroll-fix/README.md). Retest native swipes beginning on the chamber, integrated creature and arena in portrait/landscape; page content should scroll where it overflows. Check desktop integration/battle immediately on entry at normal and short/wide window sizes, without dragging to resize. Entire creatures, health, captions and sound/Leave/settings must remain reachable. Confirm ordinary taps, mute/audio and artwork retry still work. This is an open physical acceptance item.
