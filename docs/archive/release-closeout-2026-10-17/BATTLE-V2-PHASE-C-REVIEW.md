# Battle v2 Phase C production integration review

> Historical record archived at release closeout (17 October 2026 UTC). Instructions, open items and candidate descriptions below describe their dated scope. Current [rules](../../APPROVED-PLAN.md), [status](../../IMPLEMENTATION-STATUS.md) and [completed acceptance](../../BATTLE-V2-PHASE-D-ACCEPTANCE.md) supersede them.

**Historical accepted baseline:** This document records Phase C/pre-simplification implementation and dated checks. Conflicting UI/admission/credential/timer guidance is superseded by the approved [16 October simplification](PHASE-D-SIMPLIFICATION-PROPOSAL.md). Current publication and evidence are in [status](../../IMPLEMENTATION-STATUS.md).

Authorized 14 October 2026 after the user confirmed Phase B complete. Production integration is locally implemented and reviewable; no deployment. The user entered [Phase D acceptance](../../BATTLE-V2-PHASE-D-ACCEPTANCE.md) on 15 October after accepting the refinements; this document remains the implementation evidence, not a physical-device sign-off. [Specification](../../BATTLE-V2-SPEC.md), [implementation plan](BATTLE-V2-PHASE-C-PLAN.md), [architecture](../../ARCHITECTURE.md) and [actual checks](../../IMPLEMENTATION-STATUS.md) are current. Closed milestone records are [archived](../README.md).

Current refinement: [approved scope, screenshots and actual checks](PREDEPLOY-REFINEMENT.md), including the accepted dual-repeat frame method now restyled as original sculpted Gothic iron. [Frame comparison](../../predeploy-refinement-review/frame-before-after.png). The latest follow-up keeps inner scrollwork only on the splash and adds illustrated chamber reservoirs with the same accepted-injection pulse: [actual review sheet](../../predeploy-refinement-review/reservoir-contact-sheet.png). Original Phase C captures are retained in [the pre-refinement evidence folder](../../battle-v2-phase-c-review/pre-refinement-2026-10-14/contact-sheet.png); the root captures below are refreshed when the current production browser regression runs.

## Review the result

- [Production contact sheet](../../battle-v2-phase-c-review/contact-sheet.png).
- [Desktop battle](../../battle-v2-phase-c-review/battle-desktop.png), [reduced-motion phone](../../battle-v2-phase-c-review/battle-phone.png), [phone tray](../../battle-v2-phase-c-review/experiment-phone.png), [countdown](../../battle-v2-phase-c-review/countdown.png) and [authoritative result](../../battle-v2-phase-c-review/result-desktop.png).
- [Actual production recording with sound](../../battle-v2-phase-c-review/production-recording.mp4), [captured sound](../../battle-v2-phase-c-review/production-audio.webm), [browser evidence](../../battle-v2-phase-c-review/browser-evidence.json), [audio levels](../../battle-v2-phase-c-review/audio-evidence.json) and [artifact hashes](../../battle-v2-phase-c-review/review-evidence.json).

These use the actual production build and independently controlled browser clients against local SQLite-backed services. The two initial specimens were controlled in isolated server test storage to make a reproducible vote/injection study; real UI intentions, cooldowns, switches, five-second release, existing battle producer and actual result alarm ran. No production debug endpoint or invented winner/timeline exists. Recorded voted blob selection and its server-chosen arena persisted across devices; other accepted bodies/grafts have separate development-library regression evidence. Viewports emulate phones; physical devices were not tested.

For interactive local review, run `npm run dev:worker` and `npm run dev` separately and open the Vite address with independent browser sessions. Enable sound through the device controls. The normal `/` flow now runs the integrated presentation; `/battle-v2` remains a development recording study. `npm run test:battle-v2-phase-c` runs the scoped integration aggregate; `npm run review:battle-v2-production` regenerates this sheet/recording from its captures. Full preserved gameplay constituent tests are listed in status rather than falsely claimed as one aggregate run.

## Resulting behavior

Surviving active DNA selects one of six integrated forms and one of three arenas on the server, once at freeze before broadcast. Private vote counts stay private. Old schema-5 attempts retain their earlier presentation; new attempts opt in. DNA/combat magnitudes, experiment/release deadlines, score, attribution and three-round progression remain unchanged. The approved 15 October refinement gives fresh attempts a separate one-second Unleash delay. Wire protocol 5 remains compatible; JSON schema is 6 and rules 0.5.0 records the independent switch delay (0.4.0 introduced new-entry routing).

The dominant chamber retains approved modular anatomy throughout experimentation. Accepted injections coalesce into short feedback with sound; selection/rejection is inert. Existing-duration integration reveals the persisted form, then playback seeks the accepted timeline. Effects/shields/word variants and sound use the reviewed registry. Damage is text, terminal effects clear, final words persist and timeout-only subtitles name the winning side or Draw once the authoritative RoundResult is published. The integrated terminal form stays visible alongside published autopsy/session results.

Entry and session controls use the themed panel with semantic/touch/keyboard controls. New region/Same-Room/display entry controls are removed. New Quick Play entry is Americas-only; older regional tickets and legacy viewing-only displays retain owner recovery. Mute/volume/motion, visibility, resizing and artwork retry do not replace the socket or pause server deadlines. A high-water cue cursor avoids replaying old sounds after clock correction/reconnect.

## Checks, media and remaining acceptance

Actual constituent checks and results are in [status](../../IMPLEMENTATION-STATUS.md): check/build/dry run, 6 Phase C runtime + 5 production browser scenarios, preserved room/matchmaking/recovery/fresh admission/DNA/combat tests, all experimental art/composition and accepted-library regressions, and 4,536 seeded simulations. Initial obsolete UI/schema expectations and discovered feedback/accessibility issues were corrected before successful rechecks. Scope-limited RPC/alarm/FFmpeg diagnostics are described there.

The approved runtime library is about 5.43 MB across 107 files including the font license, with selected-media loading rather than eager whole-library loading. Vite also emits hashed CSS font/panel derivatives; these are approved duplicates, not new artwork. Main production JS after the refinement is approximately 361 KB (114 KB gzip), CSS approximately 34.1 KB (8.4 KB gzip), and the lazy renderer remains separate. These are measured local bundle sizes; the older 250 KB JS aspiration is exceeded and real phone startup/GPU/cache behavior still needs Phase D measurement. Browser Promise cache is capped at 28; foreground audio at 8 voices and graphic effects at 3. No measured Cloudflare capacity claim.

Human-device checklist for Phase D:

- [ ] Two real devices complete private and public three-round sessions, including late entry and replay.
- [ ] Review desktop/phone portrait/landscape UI, graft seams, silhouettes, countdown/final wording, readable health and keyboard/touch access.
- [ ] Listen for cue balance, simultaneous headroom and the boosted crawling/malfunction/poison/slowing effects; verify gesture unlock, device mute/volume and captions.
- [ ] Sleep/reload/disconnect/reconnect during experiment, release and battle; confirm same form/arena, current-frame seeking and no old sound burst.
- [ ] Test Safari/Firefox and slow/failed graphics/audio loading, reduced motion, device memory/performance and actual network adversity.
- [ ] Measure free-tier room/queue load and quotas before any capacity promise. Deploy only after explicit instruction, then verify the deployed origin separately.

Saved monsters/cards/cabinet are cancelled; naming/signals were not added. Source masters/provenance and original historical verification remain intact. Phase D review and deployment are still separate from Phase C implementation completion.

Compatibility note: an already-open pre-update browser tab retains its older UI until reload. Reload adopts the new assets/layout while preserving protocol-5 credentials and pending intentions; the stored descriptor never rerolls. Older active attempts retain legacy presentation even after reload. Updated clients receive the same chosen descriptor/arena; additive wire compatibility does not hot-replace an old JavaScript renderer.
